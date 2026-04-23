import type { EnhancementMode } from '@pageaura/shared-types';
import { getActiveHostname, readSiteSettings, writeSiteSettings } from '../shared/uiSettingsClient';

const hostnameInput = document.getElementById('hostname-input') as HTMLInputElement;
const modeSelect = document.getElementById('options-mode-selector') as HTMLSelectElement;
const enabledToggle = document.getElementById('options-site-enabled') as HTMLInputElement;
const statusText = document.getElementById('save-status') as HTMLParagraphElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;

const loadHostSettings = async (hostname: string): Promise<void> => {
  const response = await readSiteSettings(hostname);
  enabledToggle.checked = response.site.enabled;
  modeSelect.value = response.site.mode ?? 'safe';
  statusText.textContent = 'Loaded settings.';
};

saveButton.addEventListener('click', () => {
  const hostname = hostnameInput.value.trim();
  const enabled = enabledToggle.checked;
  const mode = modeSelect.value as EnhancementMode;

  if (!hostname) {
    statusText.textContent = 'Hostname is required.';
    return;
  }

  void writeSiteSettings(hostname, enabled, mode).then(() => {
    statusText.textContent = 'Saved settings.';
  });
});

hostnameInput.addEventListener('change', () => {
  const hostname = hostnameInput.value.trim();
  if (!hostname) {
    return;
  }

  void loadHostSettings(hostname);
});

void getActiveHostname().then((hostname) => {
  hostnameInput.value = hostname;
  void loadHostSettings(hostname);
});
