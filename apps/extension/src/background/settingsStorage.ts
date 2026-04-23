import type {
  EnhancementMode,
  GlobalSettings,
  PlanSummary,
  SettingsState,
  SiteSettings,
} from '@pageaura/shared-types';

const SETTINGS_STORAGE_KEY = 'pageaura.settingsState.v1';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultEnabled: true,
  defaultMode: 'safe',
  debugMode: false,
};

const createDefaultSettingsState = (): SettingsState => ({
  global: { ...DEFAULT_GLOBAL_SETTINGS },
  sites: {},
  lastSummaryByHost: {},
});

const normalizeHostname = (hostname: string): string => hostname.trim().toLowerCase();

const mergeSettingsState = (candidate?: Partial<SettingsState>): SettingsState => ({
  global: {
    ...DEFAULT_GLOBAL_SETTINGS,
    ...(candidate?.global ?? {}),
  },
  sites: {
    ...(candidate?.sites ?? {}),
  },
  lastSummaryByHost: {
    ...(candidate?.lastSummaryByHost ?? {}),
  },
});

export const readSettingsState = async (): Promise<SettingsState> => {
  const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const stateCandidate = stored[SETTINGS_STORAGE_KEY] as Partial<SettingsState> | undefined;
  return mergeSettingsState(stateCandidate);
};

export const writeSettingsState = async (state: SettingsState): Promise<SettingsState> => {
  const normalized = mergeSettingsState(state);
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: normalized,
  });

  return normalized;
};

export const readGlobalSettings = async (): Promise<GlobalSettings> => {
  const state = await readSettingsState();
  return state.global;
};

export const writeGlobalSettings = async (
  globalSettings: Partial<GlobalSettings>,
): Promise<GlobalSettings> => {
  const state = await readSettingsState();
  const nextState = await writeSettingsState({
    ...state,
    global: {
      ...state.global,
      ...globalSettings,
    },
  });

  return nextState.global;
};

export const readSiteSettings = async (hostname: string): Promise<SiteSettings | undefined> => {
  const normalizedHostname = normalizeHostname(hostname);
  const state = await readSettingsState();
  return state.sites[normalizedHostname];
};

export const writeSiteSettings = async (siteSettings: SiteSettings): Promise<SiteSettings> => {
  const normalizedHostname = normalizeHostname(siteSettings.hostname);
  const normalizedSite: SiteSettings = {
    ...siteSettings,
    hostname: normalizedHostname,
  };

  const state = await readSettingsState();
  const nextState = await writeSettingsState({
    ...state,
    sites: {
      ...state.sites,
      [normalizedHostname]: normalizedSite,
    },
  });

  return nextState.sites[normalizedHostname];
};

export const isEnhancementEnabledForHostname = async (hostname: string): Promise<boolean> => {
  const normalizedHostname = normalizeHostname(hostname);
  const state = await readSettingsState();
  const siteSetting = state.sites[normalizedHostname];

  if (siteSetting) {
    return siteSetting.enabled;
  }

  return state.global.defaultEnabled;
};

export const resolveEnhancementModeForHostname = async (
  hostname: string,
): Promise<EnhancementMode> => {
  const normalizedHostname = normalizeHostname(hostname);
  const state = await readSettingsState();
  const siteSetting = state.sites[normalizedHostname];

  return siteSetting?.mode ?? state.global.defaultMode;
};

export const writeLastPlanSummary = async (
  hostname: string,
  summary: PlanSummary,
): Promise<PlanSummary> => {
  const normalizedHostname = normalizeHostname(hostname);
  const state = await readSettingsState();

  const nextState = await writeSettingsState({
    ...state,
    lastSummaryByHost: {
      ...state.lastSummaryByHost,
      [normalizedHostname]: summary,
    },
  });

  return nextState.lastSummaryByHost[normalizedHostname];
};

export const readLastPlanSummary = async (hostname: string): Promise<PlanSummary | undefined> => {
  const normalizedHostname = normalizeHostname(hostname);
  const state = await readSettingsState();

  return state.lastSummaryByHost[normalizedHostname];
};
