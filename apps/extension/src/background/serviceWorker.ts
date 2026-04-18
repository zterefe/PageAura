import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';
import {
  isPageAuraMessage,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapResponse,
} from '../shared/messaging';

chrome.runtime.onInstalled.addListener(() => {
  const packageSummary = [
    SHARED_TYPES_PACKAGE.packageName,
    DOM_SNAPSHOT_PACKAGE.packageName,
    VALIDATOR_PACKAGE.packageName,
  ].join(', ');

  console.info(`[PageAura] scaffold ready with: ${packageSummary}`);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPageAuraMessage(message)) {
    return false;
  }

  if (message.type === PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP) {
    console.info('[PageAura] bootstrap message received', {
      hostname: message.payload.hostname,
      eligible: message.payload.eligible,
      reason: message.payload.reason,
    });

    const response: ContentBootstrapResponse = {
      ok: true,
      receivedAt: new Date().toISOString(),
      hostname: message.payload.hostname,
      eligible: message.payload.eligible,
    };

    sendResponse(response);
    return true;
  }

  return false;
});
