import type { EnhancementMode, PlannerSelection, SiteSettings } from '@pageaura/shared-types';
import {
  readSettingsState,
  readSiteSettings,
  resetSettingsToDefaults,
  writeGlobalSettings,
  writeSiteSettings,
} from '../shared/uiSettingsClient';

const hostnameInput = document.getElementById('hostname-input') as HTMLInputElement;
const modeSelect = document.getElementById('options-mode-selector') as HTMLSelectElement;
const enabledToggle = document.getElementById('options-site-enabled') as HTMLInputElement;
const statusText = document.getElementById('save-status') as HTMLParagraphElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const debugModeToggle = document.getElementById('debug-mode-toggle') as HTMLInputElement;
const dismissedCountText = document.getElementById('options-dismissed-count') as HTMLSpanElement;
const executionSignatureText = document.getElementById(
  'options-execution-signature',
) as HTMLElement;
const globalDefaultEnabledToggle = document.getElementById(
  'global-default-enabled',
) as HTMLInputElement;
const globalDefaultModeSelect = document.getElementById('global-default-mode') as HTMLSelectElement;
const plannerSelectionSelect = document.getElementById('planner-selection') as HTMLSelectElement;
const overridesList = document.getElementById('site-overrides-list') as HTMLUListElement;
const saveGlobalButton = document.getElementById('save-global-button') as HTMLButtonElement;
const resetDefaultsButton = document.getElementById('reset-defaults-button') as HTMLButtonElement;

const isValidSiteHostname = (hostname: string): boolean => {
  if (!hostname || hostname === 'unknown-host') {
    return false;
  }

  if (hostname.includes('://') || hostname.includes('/') || hostname.includes(' ')) {
    return false;
  }

  return true;
};

const renderSiteOverrides = async (): Promise<void> => {
  const response = await readSettingsState();
  const entries = Object.values(response.state.sites as Record<string, SiteSettings>).sort((a, b) =>
    a.hostname.localeCompare(b.hostname),
  );

  globalDefaultEnabledToggle.checked = response.state.global.defaultEnabled;
  globalDefaultModeSelect.value = response.state.global.defaultMode;
  debugModeToggle.checked = response.state.global.debugMode;
  plannerSelectionSelect.value = response.state.global.plannerSelection;

  overridesList.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No site overrides stored.';
    overridesList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = `${entry.hostname} — ${entry.enabled ? 'enabled' : 'disabled'} (${entry.mode ?? response.state.global.defaultMode})`;
    overridesList.append(item);
  });
};

const loadHostSettings = async (hostname: string): Promise<void> => {
  const response = await readSiteSettings(hostname);
  enabledToggle.checked = response.site.enabled;
  modeSelect.value = response.site.mode ?? 'safe';
  dismissedCountText.textContent = String(response.dismissedEnhancementIds.length);
  executionSignatureText.textContent = response.executionMemory?.signature ?? 'none';
  statusText.textContent = 'Loaded site settings.';
};

saveButton.addEventListener('click', () => {
  const hostname = hostnameInput.value.trim();
  const enabled = enabledToggle.checked;
  const mode = modeSelect.value as EnhancementMode;

  if (!isValidSiteHostname(hostname)) {
    statusText.textContent = 'Enter a valid site hostname (e.g. example.com).';
    return;
  }

  void writeSiteSettings(hostname, enabled, mode).then(async () => {
    await renderSiteOverrides();
    statusText.textContent = 'Saved site override.';
  });
});

saveGlobalButton.addEventListener('click', () => {
  void writeGlobalSettings({
    defaultEnabled: globalDefaultEnabledToggle.checked,
    defaultMode: globalDefaultModeSelect.value as EnhancementMode,
    debugMode: debugModeToggle.checked,
    plannerSelection: plannerSelectionSelect.value as PlannerSelection,
  }).then(async () => {
    await renderSiteOverrides();
    statusText.textContent = 'Saved global defaults.';
  });
});

resetDefaultsButton.addEventListener('click', () => {
  void resetSettingsToDefaults().then(async () => {
    hostnameInput.value = '';
    dismissedCountText.textContent = '0';
    executionSignatureText.textContent = 'none';
    await renderSiteOverrides();
    statusText.textContent = 'Reset to defaults complete.';
  });
});

hostnameInput.addEventListener('change', () => {
  const hostname = hostnameInput.value.trim();

  if (!isValidSiteHostname(hostname)) {
    statusText.textContent = 'Enter a valid site hostname to load settings.';
    return;
  }

  void loadHostSettings(hostname);
});

void renderSiteOverrides().then(() => {
  hostnameInput.value = '';
  statusText.textContent = 'Ready.';
});
