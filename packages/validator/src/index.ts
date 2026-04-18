import { SHARED_TYPES_PACKAGE } from '@pageaura/shared-types';

export const VALIDATOR_PACKAGE = {
  packageName: '@pageaura/validator',
  version: '0.1.0',
  validates: SHARED_TYPES_PACKAGE.packageName,
} as const;

export type {
  EnhancementPlan,
  PageAuraMessage,
  PageSnapshot,
  RuntimeExecutionPlan,
  SettingsState,
} from '@pageaura/shared-types';
export {
  enhancementPlanSchema,
  pageAuraMessageSchema,
  pageSnapshotSchema,
  runtimeExecutionPlanSchema,
  settingsStateSchema,
} from '@pageaura/shared-types';
