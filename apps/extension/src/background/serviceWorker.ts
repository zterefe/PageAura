import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';
import {
  isPageAuraMessage,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapResponse,
} from '../shared/messaging';
import {
  isEnhancementEnabledForHostname,
  readSettingsState,
  resolveEnhancementModeForHostname,
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPageAuraMessage(message)) {
    return false;
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP) {
    void (async () => {
      const enhancementEnabled = await isEnhancementEnabledForHostname(message.payload.hostname);
      const mode = await resolveEnhancementModeForHostname(message.payload.hostname);
      const eligible = message.payload.eligible && enhancementEnabled;

      console.info('[PageAura] bootstrap message received', {
        hostname: message.payload.hostname,
        eligible,
        reason: message.payload.reason,
        enhancementEnabled,
        mode,
      });

      const response: ContentBootstrapResponse = {
        ok: true,
        receivedAt: new Date().toISOString(),
        hostname: message.payload.hostname,
        eligible,
        enhancementEnabled,
        mode,
      };

      sendResponse(response);
    })();

    return true;
  }

  return false;
});
