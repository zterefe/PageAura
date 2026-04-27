import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';
import {
  isPageAuraMessage,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapResponse,
  type PageAuraMessage,
  type PlanSummaryWriteResponse,
  type SettingsReadResponse,
  type SettingsWriteResponse,
} from '../shared/messaging';
import {
  isEnhancementEnabledForHostname,
  normalizeHostname,
  readSettingsState,
  resolveEnhancementModeForHostname,
  writeLastPlanSummary,
  writeSiteSettings,
} from './settingsStorage';

chrome.runtime.onInstalled.addListener(() => {
  const packageSummary = [
    SHARED_TYPES_PACKAGE.packageName,
    DOM_SNAPSHOT_PACKAGE.packageName,
    VALIDATOR_PACKAGE.packageName,
  ].join(', ');

  void readSettingsState();
  console.info(`[PageAura] scaffold ready with: ${packageSummary}`);
});

const handleMessage = async (
  message: PageAuraMessage,
): Promise<
  | ContentBootstrapResponse
  | SettingsReadResponse
  | SettingsWriteResponse
  | PlanSummaryWriteResponse
  | null
> => {
  if (message.type === PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP) {
    const enhancementEnabled = await isEnhancementEnabledForHostname(message.payload.hostname);
    const mode = await resolveEnhancementModeForHostname(message.payload.hostname);
    const eligible = message.payload.eligible && enhancementEnabled;

    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      hostname: message.payload.hostname,
      eligible,
      enhancementEnabled,
      mode,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_READ) {
    const hostname = normalizeHostname(message.payload.hostname);
    const state = await readSettingsState();

    const site = state.sites[hostname] ?? {
      hostname,
      enabled: state.global.defaultEnabled,
      mode: state.global.defaultMode,
    };

    return {
      ok: true,
      site,
      summary: state.lastSummaryByHost[hostname] ?? null,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE) {
    const site = await writeSiteSettings({
      hostname: message.payload.hostname,
      enabled: message.payload.enabled,
      mode: message.payload.mode,
    });

    return {
      ok: true,
      site,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.PLAN_SUMMARY_WRITE) {
    const summary = await writeLastPlanSummary(message.payload.hostname, message.payload.summary);

    return {
      ok: true,
      summary,
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
