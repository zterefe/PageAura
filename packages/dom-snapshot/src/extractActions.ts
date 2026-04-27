import type { ActionNode, PageActionKind } from '@pageaura/shared-types';

import { MAX_ACTION_NODES, MAX_LABEL_LENGTH } from './constants.js';
import { createStableSelector, isElementVisible } from './domUtils.js';

const ACTION_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
].join(',');

const SEARCH_PATTERN = /(search|find|lookup|query|filter)/i;

const resolveActionKind = (element: Element): PageActionKind => {
  if (element instanceof HTMLAnchorElement) {
    return 'navigate';
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'submit') {
      return 'submit';
    }

    if (element.type === 'checkbox' || element.type === 'radio') {
      return 'toggle';
    }

    return 'input';
  }

  if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    return 'input';
  }

  if (element.getAttribute('role') === 'menuitem') {
    return 'menu';
  }

  return 'click';
};

const firstNonEmpty = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const resolveActionLabel = (element: Element): string => {
  const elementLabel = firstNonEmpty(
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    element.getAttribute('placeholder'),
    element.textContent,
    element.getAttribute('name'),
    element.tagName.toLowerCase(),
  );

  return (elementLabel ?? '').replace(/\s+/g, ' ').slice(0, MAX_LABEL_LENGTH);
};

const isDisabled = (element: Element): boolean => {
  return (element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
    .disabled;
};

const hasSearchHeuristic = (element: Element, label: string): boolean => {
  if (element instanceof HTMLInputElement && element.type === 'search') {
    return true;
  }

  const attributeSignals = [element.getAttribute('name'), element.getAttribute('id')]
    .filter(Boolean)
    .join(' ');

  return SEARCH_PATTERN.test(label) || SEARCH_PATTERN.test(attributeSignals);
};

const navigationDepth = (element: Element): number => {
  let depth = 0;
  let cursor: Element | null = element;

  while (cursor) {
    if (cursor.matches('nav, [role="navigation"], header')) {
      depth += 1;
    }
    cursor = cursor.parentElement;
  }

  return depth;
};

const buildDedupKey = (
  action: Pick<ActionNode, 'kind' | 'label' | 'selector' | 'href'>,
): string => {
  const normalizedLabel = action.label.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedHref = action.href
    ? (() => {
        const url = new URL(action.href, window.location.href);
        return `${url.pathname}${url.search}`;
      })()
    : '';
  const normalizedSelector = action.selector.replace(/:nth-of-type\(\d+\)/g, ':nth-of-type(?)');
  return `${action.kind}|${normalizedLabel}|${normalizedSelector}|${normalizedHref}`;
};

export const extractActions = (): ActionNode[] => {
  const actionElements = Array.from(document.querySelectorAll(ACTION_SELECTOR));
  const actions: ActionNode[] = [];
  const seenActions = new Map<string, number>();

  for (const element of actionElements) {
    if (!isElementVisible(element)) {
      continue;
    }

    const label = resolveActionLabel(element);
    if (!label) {
      continue;
    }

    let kind = resolveActionKind(element);
    if (hasSearchHeuristic(element, label) && kind === 'click') {
      kind = 'input';
    }

    if (navigationDepth(element) > 0 && kind === 'click') {
      kind = 'navigate';
    }

    const action: ActionNode = {
      id: `action-${actions.length + 1}`,
      kind,
      label,
      selector: createStableSelector(element),
      role: element.getAttribute('role') ?? undefined,
      href: element instanceof HTMLAnchorElement ? element.href : undefined,
      disabled: isDisabled(element) || undefined,
    };

    const dedupKey = buildDedupKey(action);
    const existingIndex = seenActions.get(dedupKey);

    if (existingIndex !== undefined) {
      const existing = actions[existingIndex];
      const existingDisabled = existing.disabled === true;
      const incomingDisabled = action.disabled === true;

      if (existingDisabled && !incomingDisabled) {
        actions[existingIndex] = {
          ...action,
          id: existing.id,
        };
      }

      continue;
    }

    actions.push({
      ...action,
      id: `action-${actions.length + 1}`,
    });
    seenActions.set(dedupKey, actions.length - 1);

    if (actions.length >= MAX_ACTION_NODES) {
      break;
    }
  }

  return actions;
};
