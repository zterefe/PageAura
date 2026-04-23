import type { EnhancementPlan } from './enhancement-plan';
import type { RuntimeExecutionPlan } from './runtime-ops';
import type { PageSnapshot } from './snapshot';
import type { PlanSummary, SiteSettings } from './settings';

export type MessageKind =
  | 'PAGEAURA/SNAPSHOT_REQUEST'
  | 'PAGEAURA/SNAPSHOT_RESULT'
  | 'PAGEAURA/PLAN_REQUEST'
  | 'PAGEAURA/PLAN_RESULT'
  | 'PAGEAURA/RUNTIME_REQUEST'
  | 'PAGEAURA/RUNTIME_RESULT'
  | 'PAGEAURA/SETTINGS_READ_REQUEST'
  | 'PAGEAURA/SETTINGS_READ_RESULT'
  | 'PAGEAURA/SETTINGS_WRITE_REQUEST'
  | 'PAGEAURA/SETTINGS_WRITE_RESULT';

export interface SnapshotRequestMessage {
  readonly type: 'PAGEAURA/SNAPSHOT_REQUEST';
  readonly requestId: string;
}

export interface SnapshotResultMessage {
  readonly type: 'PAGEAURA/SNAPSHOT_RESULT';
  readonly requestId: string;
  readonly snapshot: PageSnapshot;
}

export interface PlanRequestMessage {
  readonly type: 'PAGEAURA/PLAN_REQUEST';
  readonly requestId: string;
  readonly snapshot: PageSnapshot;
}

export interface PlanResultMessage {
  readonly type: 'PAGEAURA/PLAN_RESULT';
  readonly requestId: string;
  readonly plan: EnhancementPlan;
}

export interface RuntimeRequestMessage {
  readonly type: 'PAGEAURA/RUNTIME_REQUEST';
  readonly requestId: string;
  readonly plan: EnhancementPlan;
}

export interface RuntimeResultMessage {
  readonly type: 'PAGEAURA/RUNTIME_RESULT';
  readonly requestId: string;
  readonly execution: RuntimeExecutionPlan;
  readonly summary: PlanSummary;
}

export interface SettingsReadRequestMessage {
  readonly type: 'PAGEAURA/SETTINGS_READ_REQUEST';
  readonly requestId: string;
  readonly hostname: string;
}

export interface SettingsReadResultMessage {
  readonly type: 'PAGEAURA/SETTINGS_READ_RESULT';
  readonly requestId: string;
  readonly site: SiteSettings;
}

export interface SettingsWriteRequestMessage {
  readonly type: 'PAGEAURA/SETTINGS_WRITE_REQUEST';
  readonly requestId: string;
  readonly site: SiteSettings;
}

export interface SettingsWriteResultMessage {
  readonly type: 'PAGEAURA/SETTINGS_WRITE_RESULT';
  readonly requestId: string;
  readonly site: SiteSettings;
}

export type PageAuraMessage =
  | SnapshotRequestMessage
  | SnapshotResultMessage
  | PlanRequestMessage
  | PlanResultMessage
  | RuntimeRequestMessage
  | RuntimeResultMessage
  | SettingsReadRequestMessage
  | SettingsReadResultMessage
  | SettingsWriteRequestMessage
  | SettingsWriteResultMessage;
