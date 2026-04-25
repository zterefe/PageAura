import type { EnhancementMode, PlanSummary } from '@pageaura/shared-types';
import { getActiveHostname, readSiteSettings, writeSiteSettings } from '../shared/uiSettingsClient';

const modeSelect = document.getElementById('mode-selector') as HTMLSelectElement;
const enabledToggle = document.getElementById('site-enabled') as HTMLInputElement;
const summaryText = document.getElementById('summary-placeholder') as HTMLParagraphElement;
const summaryGeneratedAtText = document.getElementById(
  'summary-generated-at',
) as HTMLParagraphElement;
const hostnameText = document.getElementById('hostname') as HTMLHeadingElement;
const siteStatePill = document.getElementById('site-state-pill') as HTMLSpanElement;
const plannerStatusText = document.getElementById('planner-status') as HTMLParagraphElement;
const rerunButton = document.getElementById('rerun-enhancements') as HTMLButtonElement;
const removeButton = document.getElementById('remove-enhancements') as HTMLButtonElement;

let currentHostname = 'unknown-host';
let currentMode: EnhancementMode = 'safe';
let currentEnabled = true;
let lastSummary: PlanSummary | null = null;

const formatTimestamp = (timestamp: string): string => {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return 'Last run: unknown';
  }

  return `Last run: ${new Date(parsed).toLocaleString()}`;
};

const renderPlannerStatus = (): void => {
  const statusLabel = currentEnabled ? 'active' : 'paused';
  siteStatePill.dataset.status = statusLabel;
  siteStatePill.textContent = currentEnabled ? 'Enabled' : 'Disabled';

  if (!currentEnabled) {
    plannerStatusText.textContent = 'Planner status: paused for this site';
    return;
  }

  if (lastSummary) {
    plannerStatusText.textContent = 'Planner status: ready (last run successful)';
    return;
  }

  plannerStatusText.textContent = 'Planner status: waiting for first run';
};

const renderSummary = (): void => {
  if (!lastSummary) {
    summaryText.textContent = 'Enhancement summary is not available yet for this page.';
    summaryGeneratedAtText.textContent = '';
    return;
  }

  summaryText.textContent = lastSummary.summary;
  summaryGeneratedAtText.textContent = formatTimestamp(lastSummary.generatedAt);
};

const render = (): void => {
  hostnameText.textContent = currentHostname;
  modeSelect.value = currentMode;
  enabledToggle.checked = currentEnabled;
  renderSummary();
  renderPlannerStatus();
};

const syncSettings = async (): Promise<void> => {
  const response = await writeSiteSettings(currentHostname, currentEnabled, currentMode);
  currentMode = response.site.mode ?? 'safe';
  currentEnabled = response.site.enabled;
  render();
};

const refresh = async (): Promise<void> => {
  const response = await readSiteSettings(currentHostname);
  currentMode = response.site.mode ?? 'safe';
  currentEnabled = response.site.enabled;
  lastSummary = response.summary;
  render();
};

const withActiveTab = async (callback: (tabId: number) => Promise<void>): Promise<void> => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (typeof activeTab?.id !== 'number') {
    return;
  }

  await callback(activeTab.id);
};

const rerunEnhancements = async (): Promise<void> => {
  await withActiveTab(async (tabId) => {
    await chrome.tabs.reload(tabId);
  });
  plannerStatusText.textContent = 'Planner status: rerun requested (page reload started)';
};

const removeEnhancements = async (): Promise<void> => {
  currentEnabled = false;
  await syncSettings();

  await withActiveTab(async (tabId) => {
    await chrome.tabs.reload(tabId);
  });

  plannerStatusText.textContent = 'Planner status: enhancements removed and site disabled';
};

const boot = async (): Promise<void> => {
  currentHostname = await getActiveHostname();
  await refresh();
};

enabledToggle.addEventListener('change', () => {
  currentEnabled = enabledToggle.checked;
  void syncSettings();
});

modeSelect.addEventListener('change', () => {
  currentMode = modeSelect.value as EnhancementMode;
  void syncSettings();
});

rerunButton.addEventListener('click', () => {
  void rerunEnhancements();
});

removeButton.addEventListener('click', () => {
  void removeEnhancements();
});

void boot();
