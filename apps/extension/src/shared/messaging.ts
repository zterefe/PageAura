import type {
  EnhancementMode,
  PlanSummary,
  SettingsState,
  SiteSettings,
} from '@pageaura/shared-types';

export const PAGE_AURA_MESSAGE_SOURCE = 'pageaura';

export const PAGE_AURA_MESSAGE_TYPE = {
  CONTENT_BOOTSTRAP: 'CONTENT_BOOTSTRAP',
  SETTINGS_READ: 'SETTINGS_READ',
  SETTINGS_WRITE: 'SETTINGS_WRITE',
  PLAN_SUMMARY_WRITE: 'PLAN_SUMMARY_WRITE',
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

export type SettingsReadMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.SETTINGS_READ;
  payload: {
    hostname: string;
  };
};

export type SettingsReadResponse = {
  ok: true;
  site: SiteSettings;
  summary: PlanSummary | null;
};

export type SettingsWriteMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE;
  payload: {
    hostname: string;
    enabled: boolean;
    mode: EnhancementMode;
  };
};

export type SettingsWriteResponse = {
  ok: true;
  site: SiteSettings;
};

export type PlanSummaryWriteMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.PLAN_SUMMARY_WRITE;
  payload: {
    hostname: string;
    summary: PlanSummary;
  };
};

export type PlanSummaryWriteResponse = {
  ok: true;
  summary: PlanSummary;
};

export type PageAuraMessage =
  | ContentBootstrapMessage
  | SettingsReadMessage
  | SettingsWriteMessage
  | PlanSummaryWriteMessage;

export const isPageAuraMessage = (value: unknown): value is PageAuraMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PageAuraMessage>;
  return (
    candidate.source === PAGE_AURA_MESSAGE_SOURCE &&
    Object.values(PAGE_AURA_MESSAGE_TYPE).includes(candidate.type as PageAuraMessageType)
  );
};

export const DEFAULT_MODE: EnhancementMode = 'safe';

export const DEFAULT_SETTINGS_STATE: SettingsState = {
  global: {
    defaultEnabled: true,
    defaultMode: DEFAULT_MODE,
    debugMode: false,
  },
  sites: {},
  lastSummaryByHost: {},
};
