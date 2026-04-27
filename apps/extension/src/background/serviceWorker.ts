import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';
import {
  isPageAuraMessage,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapResponse,
  type DebugModeWriteResponse,
  type GlobalSettingsWriteResponse,
  type PageAuraMessage,
  type PlanSummaryWriteResponse,
  type SettingsReadResponse,
  type SettingsResetDefaultsResponse,
  type SettingsStateReadResponse,
  type SettingsWriteResponse,
} from '../shared/messaging';
import {
  hasExecutionSignatureMatch,
  isEnhancementEnabledForHostname,
  normalizeHostname,
  readLastExecutionMemory,
  readSettingsState,
  resetSettingsToDefaults,
  resolveEnhancementModeForHostname,
  writeDebugMode,
  writeGlobalSettings,
  writeDismissedEnhancementIds,
  writeExecutionMemory,
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
  | SettingsStateReadResponse
  | GlobalSettingsWriteResponse
  | SettingsResetDefaultsResponse
  | DebugModeWriteResponse
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
      debugMode: state.global.debugMode,
      dismissedEnhancementIds: state.dismissedEnhancementIdsByHost[hostname] ?? [],
      executionMemory: state.lastExecutionByHost[hostname] ?? null,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_WRITE) {
    const shouldSkipReapply = message.payload.executionSignature
      ? await hasExecutionSignatureMatch(
          message.payload.hostname,
          message.payload.executionSignature,
        )
      : false;

    const site = await writeSiteSettings({
      hostname: message.payload.hostname,
      enabled: message.payload.enabled,
      mode: message.payload.mode,
    });

    if (message.payload.dismissedEnhancementIds) {
      await writeDismissedEnhancementIds(
        message.payload.hostname,
        message.payload.dismissedEnhancementIds,
      );
    }

    const executionMemory = message.payload.executionSignature
      ? await writeExecutionMemory(
          message.payload.hostname,
          message.payload.executionSignature,
          message.payload.planId,
        )
      : await readLastExecutionMemory(message.payload.hostname);

    return {
      ok: true,
      site,
      shouldSkipReapply,
      executionMemory: executionMemory ?? null,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_STATE_READ) {
    const state = await readSettingsState();

    return {
      ok: true,
      state,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.GLOBAL_SETTINGS_WRITE) {
    const global = await writeGlobalSettings(message.payload);

    return {
      ok: true,
      global,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.SETTINGS_RESET_DEFAULTS) {
    const state = await resetSettingsToDefaults();

    return {
      ok: true,
      state,
    };
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.DEBUG_MODE_WRITE) {
    const debugMode = await writeDebugMode(message.payload.debugMode);

    return {
      ok: true,
      debugMode,
    } satisfies DebugModeWriteResponse;
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
