import {
  PAGE_AURA_MESSAGE_SOURCE,
  PAGE_AURA_MESSAGE_TYPE,
  type ContentBootstrapMessage,
  type ContentBootstrapResponse,
} from '../shared/messaging';
import { getPageEligibility } from '../shared/pageEligibility';

const currentUrl = new URL(window.location.href);
const eligibility = getPageEligibility(currentUrl);

const bootstrapMessage: ContentBootstrapMessage = {
  source: PAGE_AURA_MESSAGE_SOURCE,
  type: PAGE_AURA_MESSAGE_TYPE.CONTENT_BOOTSTRAP,
  payload: eligibility,
};

chrome.runtime.sendMessage(bootstrapMessage, (response?: unknown) => {
  const typedResponse = response as ContentBootstrapResponse | undefined;
  console.info('[PageAura] content bootstrap sent', {
    hostname: eligibility.hostname,
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    response: typedResponse,
  });
});
