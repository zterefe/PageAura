export const PAGE_AURA_MESSAGE_SOURCE = 'pageaura';

export const PAGE_AURA_MESSAGE_TYPE = {
  CONTENT_BOOTSTRAP: 'CONTENT_BOOTSTRAP',
} as const;

export type PageAuraMessageType =
  (typeof PAGE_AURA_MESSAGE_TYPE)[keyof typeof PAGE_AURA_MESSAGE_TYPE];

export type PageEligibility = {
  hostname: string;
  eligible: boolean;
  reason: string;
};

export type ContentBootstrapMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP;
  payload: PageEligibility;
};

export type ContentBootstrapResponse = {
  ok: true;
  receivedAt: string;
  hostname: string;
  eligible: boolean;
  enhancementEnabled: boolean;
  mode: 'safe' | 'enhanced' | 'experimental';
};

export type PageAuraMessage = ContentBootstrapMessage;

export const isPageAuraMessage = (value: unknown): value is PageAuraMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PageAuraMessage>;
  return (
    candidate.source === PAGE_AURA_MESSAGE_SOURCE &&
    candidate.type === PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP
  );
};
