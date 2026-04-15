import { DOM_SNAPSHOT_PACKAGE } from '@pageaura/dom-snapshot';
import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';
import { VALIDATOR_PACKAGE } from '@pageaura/validator';

chrome.runtime.onInstalled.addListener(() => {
  const packageSummary = [
    SHARED_TYPES_PACKAGE.packageName,
    DOM_SNAPSHOT_PACKAGE.packageName,
    VALIDATOR_PACKAGE.packageName,
  ].join(', ');

  console.info(`[PageAura] scaffold ready with: ${packageSummary}`);
});
