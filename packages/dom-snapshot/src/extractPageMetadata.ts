import type { PageMetadata } from '@pageaura/shared-types';

import { inferPageTypeHints } from './inferPageTypeHints.js';

export const extractPageMetadata = (): PageMetadata => {
  return {
    url: window.location.href,
    hostname: window.location.hostname,
    title: document.title.trim(),
    capturedAt: new Date().toISOString(),
    pageTypeHints: inferPageTypeHints(),
  };
};
