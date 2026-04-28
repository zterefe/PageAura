import type {
  ExecutionMemory,
  EnhancementMode,
  GlobalSettings,
  PlanSummary,
  SettingsState,
  SiteSettings,
} from '@pageaura/shared-types';

export const PAGE_AURA_MESSAGE_SOURCE = 'pageaura';

export const PAGE_AURA_MESSAGE_TYPE = {
  CONTENT_BOOTSTRAP: 'CONTENT_BOOTSTRAP',
  SETTINGS_READ: 'SETTINGS_READ',
  SETTINGS_WRITE: 'SETTINGS_WRITE',
  SETTINGS_STATE_READ: 'SETTINGS_STATE_READ',
  GLOBAL_SETTINGS_WRITE: 'GLOBAL_SETTINGS_WRITE',
  SETTINGS_RESET_DEFAULTS: 'SETTINGS_RESET_DEFAULTS',
  DEBUG_MODE_WRITE: 'DEBUG_MODE_WRITE',
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
  debugMode: boolean;
  dismissedEnhancementIds: readonly string[];
  executionMemory: ExecutionMemory | null;
};

export type SettingsWriteMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE;
  payload: {
    hostname: string;
    enabled: boolean;
    mode: EnhancementMode;
    dismissedEnhancementIds?: readonly string[];
    executionSignature?: string;
    planId?: string;
  };
};

export type SettingsWriteResponse = {
  ok: true;
  site: SiteSettings;
  shouldSkipReapply: boolean;
  executionMemory: ExecutionMemory | null;
};

export type SettingsStateReadMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.SETTINGS_STATE_READ;
  payload: Record<string, never>;
};

export type SettingsStateReadResponse = {
  ok: true;
  state: SettingsState;
};

export type GlobalSettingsWriteMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.GLOBAL_SETTINGS_WRITE;
  payload: Partial<GlobalSettings>;
};

export type GlobalSettingsWriteResponse = {
  ok: true;
  global: GlobalSettings;
};

export type SettingsResetDefaultsMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.SETTINGS_RESET_DEFAULTS;
  payload: Record<string, never>;
};

export type SettingsResetDefaultsResponse = {
  ok: true;
  state: SettingsState;
};

export type DebugModeWriteMessage = {
  source: typeof PAGE_AURA_MESSAGE_SOURCE;
  type: typeof PAGE_AURA_MESSAGE_TYPE.DEBUG_MODE_WRITE;
  payload: {
    debugMode: boolean;
  };
};

export type DebugModeWriteResponse = {
  ok: true;
  debugMode: boolean;
};

export type PageAuraMessage =
  | ContentBootstrapMessage
  | SettingsReadMessage
  | SettingsWriteMessage
  | SettingsStateReadMessage
  | GlobalSettingsWriteMessage
  | SettingsResetDefaultsMessage
  | DebugModeWriteMessage
  | PlanSummaryWriteMessage;

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
    plannerSelection: 'community',
  },
  sites: {},
  lastSummaryByHost: {},
  dismissedEnhancementIdsByHost: {},
  lastExecutionByHost: {},
};
