import type { EnhancementPlan, EnhancementType } from './enhancement-plan';
import type { PageSnapshot } from './snapshot';

export type PlannerMode = 'safe' | 'enhanced' | 'experimental';

export interface PlannerCapabilities {
  readonly mode: PlannerMode;
  readonly allowedEnhancementTypes: readonly EnhancementType[];
  readonly maxEnhancements: number;
  readonly includeRationale: boolean;
}

export interface PlannerInput {
  readonly snapshot: PageSnapshot;
  readonly capabilities: PlannerCapabilities;
}

export interface Planner {
  readonly id: string;
  plan(input: PlannerInput): Promise<unknown>;
}

export type PlannerErrorCode =
  | 'PLANNER_REQUEST_FAILED'
  | 'PLANNER_INVALID_OUTPUT'
  | 'PLANNER_EMPTY_OUTPUT';

export interface PlannerErrorContract {
  readonly code: PlannerErrorCode;
  readonly message: string;
  readonly plannerId?: string;
  readonly cause?: unknown;
}

export interface PlannerSuccessResult {
  readonly ok: true;
  readonly plan: EnhancementPlan;
}

export interface PlannerFailureResult {
  readonly ok: false;
  readonly error: PlannerErrorContract;
}

export type PlannerResult = PlannerSuccessResult | PlannerFailureResult;
