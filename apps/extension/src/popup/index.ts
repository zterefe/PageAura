import type { EnhancementMode } from '@pageaura/shared-types';
import { getActiveHostname, readSiteSettings, writeSiteSettings } from '../shared/uiSettingsClient';

const modeSelect = document.getElementById('mode-selector') as HTMLSelectElement;
const enabledToggle = document.getElementById('site-enabled') as HTMLInputElement;
const summaryText = document.getElementById('summary-placeholder') as HTMLParagraphElement;
const hostnameText = document.getElementById('hostname') as HTMLSpanElement;

let currentHostname = 'unknown-host';
let currentMode: EnhancementMode = 'safe';
let currentEnabled = true;

const render = (): void => {
  hostnameText.textContent = currentHostname;
  modeSelect.value = currentMode;
  enabledToggle.checked = currentEnabled;
};

const syncSettings = async (): Promise<void> => {
  const response = await writeSiteSettings(currentHostname, currentEnabled, currentMode);
  currentMode = response.site.mode ?? 'safe';
  currentEnabled = response.site.enabled;
  render();
};

const boot = async (): Promise<void> => {
  currentHostname = await getActiveHostname();
  const response = await readSiteSettings(currentHostname);
  currentMode = response.site.mode ?? 'safe';
  currentEnabled = response.site.enabled;

  summaryText.textContent = response.summary
    ? response.summary.summary
    : 'Enhancement summary is not available yet for this page.';

  render();
};

enabledToggle.addEventListener('change', () => {
  currentEnabled = enabledToggle.checked;
  void syncSettings();
});

modeSelect.addEventListener('change', () => {
  currentMode = modeSelect.value as EnhancementMode;
  void syncSettings();
});

void boot();
