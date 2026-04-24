import type { EnhancementMode } from '@pageaura/shared-types';
import { readSiteSettings, writeSiteSettings } from '../shared/uiSettingsClient';

const hostnameInput = document.getElementById('hostname-input') as HTMLInputElement;
const modeSelect = document.getElementById('options-mode-selector') as HTMLSelectElement;
const enabledToggle = document.getElementById('options-site-enabled') as HTMLInputElement;
const statusText = document.getElementById('save-status') as HTMLParagraphElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;

const isValidSiteHostname = (hostname: string): boolean => {
  if (!hostname || hostname === 'unknown-host') {
    return false;
  }

  // basic hostname guard (no schemes/paths/spaces)
  if (hostname.includes('://') || hostname.includes('/') || hostname.includes(' ')) {
    return false;
  }

  return true;
};

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

  if (!isValidSiteHostname(hostname)) {
    statusText.textContent = 'Enter a valid site hostname (e.g. example.com).';
    return;
  }

  void writeSiteSettings(hostname, enabled, mode).then(() => {
    statusText.textContent = 'Saved settings.';
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

hostnameInput.value = '';
statusText.textContent = 'Enter a site hostname to load settings.';
