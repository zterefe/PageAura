import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import type { SettingsState, SiteSettings } from '@pageaura/shared-types';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';
import {
  DEFAULT_SETTINGS_STATE,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapResponse,
  type PageAuraMessage,
  type SettingsReadResponse,
  type SettingsWriteResponse,
  isPageAuraMessage,
} from '../shared/messaging';

const SETTINGS_STORAGE_KEY = 'pageAuraSettings';

const normalizeSiteSettings = (hostname: string, settingsState: SettingsState): SiteSettings => {
  const existing = settingsState.sites[hostname];
  return {
    hostname,
    enabled: existing?.enabled ?? settingsState.global.defaultEnabled,
    mode: existing?.mode ?? settingsState.global.defaultMode,
  };
};

const getSettingsState = async (): Promise<SettingsState> => {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const storedState = result[SETTINGS_STORAGE_KEY] as SettingsState | undefined;
  return storedState ?? DEFAULT_SETTINGS_STATE;
};

const setSettingsState = async (settingsState: SettingsState): Promise<void> => {
  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settingsState,
  });
};

chrome.runtime.onInstalled.addListener(() => {
  const packageSummary = [
    SHARED_TYPES_PACKAGE.packageName,
    DOM_SNAPSHOT_PACKAGE.packageName,
    VALIDATOR_PACKAGE.packageName,
  ].join(', ');

  console.info(`[PageAura] scaffold ready with: ${packageSummary}`);
});

const handleMessage = async (
  message: PageAuraMessage,
): Promise<ContentBootstrapResponse | SettingsReadResponse | SettingsWriteResponse | null> => {
  if (message.type === PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP) {
    console.info('[PageAura] bootstrap message received', {
      hostname: message.payload.hostname,
      eligible: message.payload.eligible,
      reason: message.payload.reason,
    });

    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      hostname: message.payload.hostname,
      eligible: message.payload.eligible,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_READ) {
    const settingsState = await getSettingsState();
    const site = normalizeSiteSettings(message.payload.hostname, settingsState);
    return {
      ok: true,
      site,
      summary: settingsState.lastSummaryByHost[message.payload.hostname] ?? null,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE) {
    const settingsState = await getSettingsState();
    const nextSite: SiteSettings = {
      hostname: message.payload.hostname,
      enabled: message.payload.enabled,
      mode: message.payload.mode,
    };
    const nextState: SettingsState = {
      ...settingsState,
      sites: {
        ...settingsState.sites,
        [message.payload.hostname]: nextSite,
      },
    };

    await setSettingsState(nextState);

    return {
      ok: true,
      site: nextSite,
    };
  }

  return null;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPageAuraMessage(message)) {
    return false;
  }

  void handleMessage(message).then((response) => {
    sendResponse(response);
  });

  return true;
});
