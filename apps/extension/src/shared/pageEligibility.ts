import type { PageEligibility } from './messaging';

const BLOCKED_HOSTNAME_PATTERNS = [/^chrome\.google\.com$/i, /^chromewebstore\.google\.com$/i];

export const getPageEligibility = (url: URL): PageEligibility => {
  const isWebProtocol = url.protocol === 'http:' || url.protocol === 'https:';

  if (!isWebProtocol) {
    return {
      hostname: url.hostname,
      eligible: false,
      reason: `Unsupported protocol: ${url.protocol}`,
    };
  }

  if (BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    return {
      hostname: url.hostname,
      eligible: false,
      reason: 'Blocked hostname',
    };
  }

  return {
    hostname: url.hostname,
    eligible: true,
    reason: 'Eligible for PageAura',
  };
};
