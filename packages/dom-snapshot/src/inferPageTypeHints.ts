import type { PageTypeHint } from '@pageaura/shared-types';

const SEARCH_INPUT_SELECTOR = [
  'input[type="search"]',
  'input[name*="search" i]',
  'input[id*="search" i]',
  '[role="search"] input',
].join(',');

const NAV_CONTAINER_SELECTOR = 'header nav, nav, [role="navigation"]';
const FORM_SELECTOR = 'form';
const LISTING_SELECTOR = 'ul li, ol li, [role="listitem"], [data-testid*="card" i]';

const hasSearchSignals = (): boolean => {
  const querySignal = /[?&](q|query|search|keyword)=/i.test(window.location.search);
  return Boolean(document.querySelector(SEARCH_INPUT_SELECTOR)) || querySignal;
};

export const inferPageTypeHints = (): PageTypeHint[] => {
  const hints = new Set<PageTypeHint>();

  const navCount = document.querySelectorAll(NAV_CONTAINER_SELECTOR).length;
  const formCount = document.querySelectorAll(FORM_SELECTOR).length;
  const listingSignalCount = document.querySelectorAll(LISTING_SELECTOR).length;
  const articleSignal = Boolean(
    document.querySelector('article, main article, [itemprop="articleBody"]'),
  );

  if (hasSearchSignals()) {
    hints.add('search');
  }

  if (navCount > 0) {
    hints.add('navigation');
  }

  if (formCount > 0) {
    hints.add('form');
  }

  if (listingSignalCount >= 6) {
    hints.add('listing');
  }

  if (articleSignal) {
    hints.add('article');
  }

  if (hints.size === 0 || document.body.innerText.trim().length > 300) {
    hints.add('content');
  }

  if (hints.has('navigation') && hints.has('search') && hints.size <= 3) {
    hints.add('landing');
  }

  return Array.from(hints);
};
