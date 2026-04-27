const VISIBLE_STYLE_BLOCKERS = new Set(['none', 'hidden']);

const STABLE_DATA_ATTRIBUTES = ['data-testid', 'data-test', 'data-qa', 'data-cy'] as const;

export const toSelectorFragment = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const hasLikelyStableId = (id: string): boolean => {
  return !/^(ember|react|vue|svelte|headlessui|radix)-/i.test(id) && !/\d{4,}/.test(id);
};

const pickStableDataSelector = (element: Element): string | null => {
  for (const attribute of STABLE_DATA_ATTRIBUTES) {
    const value = element.getAttribute(attribute)?.trim();
    if (value) {
      return `${element.tagName.toLowerCase()}[${attribute}="${CSS.escape(value)}"]`;
    }
  }

  return null;
};

const pickSemanticSelector = (element: Element): string | null => {
  const role = element.getAttribute('role');
  if (role) {
    const ariaLabel = element.getAttribute('aria-label')?.trim();
    if (ariaLabel) {
      return `${element.tagName.toLowerCase()}[role="${CSS.escape(role)}"][aria-label="${CSS.escape(ariaLabel)}"]`;
    }

    return `${element.tagName.toLowerCase()}[role="${CSS.escape(role)}"]`;
  }

  const namedAttribute = element.getAttribute('name')?.trim();
  if (namedAttribute) {
    return `${element.tagName.toLowerCase()}[name="${CSS.escape(namedAttribute)}"]`;
  }

  return null;
};

export const createStableSelector = (element: Element): string => {
  if (element.id && hasLikelyStableId(element.id)) {
    return `#${CSS.escape(element.id)}`;
  }

  const stableDataSelector = pickStableDataSelector(element);
  if (stableDataSelector) {
    return stableDataSelector;
  }

  const semanticSelector = pickSemanticSelector(element);
  if (semanticSelector) {
    return semanticSelector;
  }

  const tagName = element.tagName.toLowerCase();
  const classList = Array.from(element.classList)
    .filter((className) => !/^css-|^sc-|^jsx-|^_[a-z0-9]/i.test(className))
    .slice(0, 2)
    .map((className) => `.${CSS.escape(className)}`)
    .join('');

  if (classList) {
    return `${tagName}${classList}`;
  }

  const parent = element.parentElement;
  if (!parent) {
    return tagName;
  }

  const parentSelector = createStableSelector(parent);
  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  const siblingIndex = siblings.indexOf(element) + 1;
  return `${parentSelector} > ${tagName}:nth-of-type(${siblingIndex})`;
};

export const isElementVisible = (element: Element): boolean => {
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const htmlElement = element as HTMLElement;
  if (htmlElement.hidden) {
    return false;
  }

  const style = window.getComputedStyle(htmlElement);
  if (VISIBLE_STYLE_BLOCKERS.has(style.display) || VISIBLE_STYLE_BLOCKERS.has(style.visibility)) {
    return false;
  }

  return style.opacity !== '0';
};

export const textContentWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};
