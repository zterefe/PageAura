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

const resolveActionKind = (element: Element): PageActionKind => {
  if (element instanceof HTMLAnchorElement) {
    return 'navigate';
  }

  if (element instanceof HTMLInputElement) {
    return element.type === 'submit' ? 'submit' : 'input';
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
    element.tagName.toLowerCase());

  return (elementLabel ?? '').replace(/\s+/g, ' ').slice(0, MAX_LABEL_LENGTH);
};

const isDisabled = (element: Element): boolean => {
  return (element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
    .disabled;
};

export const extractActions = (): ActionNode[] => {
  const actionElements = Array.from(document.querySelectorAll(ACTION_SELECTOR));
  const actions: ActionNode[] = [];

  for (const element of actionElements) {
    if (!isElementVisible(element)) {
      continue;
    }

    const label = resolveActionLabel(element);
    if (!label) {
      continue;
    }

    const action: ActionNode = {
      id: `action-${actions.length + 1}`,
      kind: resolveActionKind(element),
      label,
      selector: createStableSelector(element),
      role: element.getAttribute('role') ?? undefined,
      href: element instanceof HTMLAnchorElement ? element.href : undefined,
      disabled: isDisabled(element) || undefined,
    };

    actions.push(action);

    if (actions.length >= MAX_ACTION_NODES) {
      break;
    }
  }

  return actions;
};
