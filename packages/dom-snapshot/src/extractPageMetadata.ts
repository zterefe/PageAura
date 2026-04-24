import type { PageMetadata } from '@pageaura/shared-types';

export const extractPageMetadata = (): PageMetadata => {
  return {
    url: window.location.href,
    hostname: window.location.hostname,
    title: document.title.trim(),
    capturedAt: new Date().toISOString(),
  };
};
