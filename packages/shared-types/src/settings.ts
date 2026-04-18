export type EnhancementMode = 'safe' | 'enhanced' | 'experimental';

export interface SiteSettings {
  readonly hostname: string;
  readonly enabled: boolean;
  readonly mode?: EnhancementMode;
}

export interface PlanSummary {
  readonly planId: string;
  readonly generatedAt: string;
  readonly enhancementCount: number;
  readonly summary: string;
}

export interface GlobalSettings {
  readonly defaultEnabled: boolean;
  readonly defaultMode: EnhancementMode;
  readonly debugMode: boolean;
}

export interface SettingsState {
  readonly global: GlobalSettings;
  readonly sites: Readonly<Record<string, SiteSettings>>;
  readonly lastSummaryByHost: Readonly<Record<string, PlanSummary>>;
}
