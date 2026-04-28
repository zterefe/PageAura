const isSemanticSelector = (selector: string): boolean => {
  return selector.startsWith('semantic:');
};

const firstMatch = (selectors: readonly string[]): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node) {
      return selector;
    }
  }

  return null;
};

const resolveSemanticSelector = (selector: string): string => {
  const key = selector.slice('semantic:'.length).trim().toLowerCase();

  switch (key) {
    case 'root':
      return 'html';
    case 'body':
      return 'body';
    case 'main':
      return firstMatch(['main', '[role="main"]', '#main', '.main']) ?? 'main';
    case 'header':
      return firstMatch(['header', '[role="banner"]']) ?? 'header';
    case 'footer':
      return firstMatch(['footer', '[role="contentinfo"]']) ?? 'footer';
    case 'nav':
    case 'navigation':
      return firstMatch(['nav', '[role="navigation"]']) ?? 'nav';
    case 'interactive':
      return 'button, a, input, select, textarea';
    case 'text':
      return 'p, span, li, dt, dd, label';
    default:
      return key;
  }
};

export const resolveRuntimeSelector = (selector: string): string => {
  const normalized = selector.trim();
  if (!normalized) {
    return normalized;
  }

  if (isSemanticSelector(normalized)) {
    return resolveSemanticSelector(normalized);
  }

  return normalized;
};
