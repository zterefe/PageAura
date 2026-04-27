import type { EnhancementMode, GlobalSettings, SettingsState } from '@pageaura/shared-types';
import {
  PAGE_AURA_MESSAGE_SOURCE,
  PAGE_AURA_MESSAGE_TYPE,
  type DebugModeWriteResponse,
  type GlobalSettingsWriteResponse,
  type SettingsReadResponse,
  type SettingsResetDefaultsResponse,
  type SettingsStateReadResponse,
  type SettingsWriteResponse,
} from './messaging';

const resolveActiveHostname = async (): Promise<string | null> => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.url) {
    return null;
  }

  try {
    return new URL(activeTab.url).hostname;
  } catch {
    return null;
  }
};

export const getActiveHostname = async (): Promise<string> => {
  const hostname = await resolveActiveHostname();
  return hostname ?? 'unknown-host';
};

export const readSiteSettings = async (hostname: string): Promise<SettingsReadResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.SETTINGS_READ,
    payload: { hostname },
  })) as SettingsReadResponse;

  return response;
};

export const readSettingsState = async (): Promise<SettingsStateReadResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.SETTINGS_STATE_READ,
    payload: {},
  })) as SettingsStateReadResponse;

  return response;
};

export const writeSiteSettings = async (
  hostname: string,
  enabled: boolean,
  mode: EnhancementMode,
  options?: {
    dismissedEnhancementIds?: readonly string[];
    executionSignature?: string;
    planId?: string;
  },
): Promise<SettingsWriteResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE,
    payload: {
      hostname,
      enabled,
      mode,
      dismissedEnhancementIds: options?.dismissedEnhancementIds,
      executionSignature: options?.executionSignature,
      planId: options?.planId,
    },
  })) as SettingsWriteResponse;

  return response;
};

export const writeGlobalSettings = async (
  global: Partial<GlobalSettings>,
): Promise<GlobalSettingsWriteResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.GLOBAL_SETTINGS_WRITE,
    payload: global,
  })) as GlobalSettingsWriteResponse;

  return response;
};

export const resetSettingsToDefaults = async (): Promise<SettingsResetDefaultsResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.SETTINGS_RESET_DEFAULTS,
    payload: {},
  })) as SettingsResetDefaultsResponse;

  return response;
};

export const writeDebugMode = async (debugMode: boolean): Promise<DebugModeWriteResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.DEBUG_MODE_WRITE,
    payload: { debugMode },
  })) as DebugModeWriteResponse;

  return response;
};
