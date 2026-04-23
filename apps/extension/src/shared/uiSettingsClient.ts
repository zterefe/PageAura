import type { EnhancementMode } from '@pageaura/shared-types';
import {
  PAGE_AURA_MESSAGE_SOURCE,
  PAGE_AURA_MESSAGE_TYPE,
  type SettingsReadResponse,
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

export const writeSiteSettings = async (
  hostname: string,
  enabled: boolean,
  mode: EnhancementMode,
): Promise<SettingsWriteResponse> => {
  const response = (await chrome.runtime.sendMessage({
    source: PAGE_AURA_MESSAGE_SOURCE,
    type: PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE,
    payload: { hostname, enabled, mode },
  })) as SettingsWriteResponse;

  return response;
};
