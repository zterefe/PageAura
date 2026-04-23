const VISIBLE_STYLE_BLOCKERS = new Set(['none', 'hidden']);

export const toSelectorFragment = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const createStableSelector = (element: Element): string => {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const tagName = element.tagName.toLowerCase();
  const classList = Array.from(element.classList)
    .slice(0, 2)
    .map((className) => `.${CSS.escape(className)}`)
    .join('');

  if (classList) {
    return `${tagName}${classList}`;
  }

  const namedAttribute = element.getAttribute('name') ?? element.getAttribute('data-testid');
  if (namedAttribute) {
    return `${tagName}[name="${CSS.escape(namedAttribute)}"]`;
  }

  const parent = element.parentElement;
  if (!parent) {
    return tagName;
  }

  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  const siblingIndex = siblings.indexOf(element) + 1;
  return `${parent.tagName.toLowerCase()} > ${tagName}:nth-of-type(${siblingIndex})`;
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
