import type { BehaviorType, NumericTokenSet } from './enhancement-plan';

export type RuntimeOpType =
  | 'mount_overlay_root'
  | 'insert_toolbar'
  | 'insert_jump_links'
  | 'apply_theme_tokens'
  | 'apply_style_patch';

export type CleanupTarget = 'nodes' | 'listeners' | 'styles' | 'attributes' | 'custom';
export type CleanupTrigger = 'before_rerun' | 'on_dispose';

export interface CleanupRegistrationContract {
  readonly cleanupId: string;
  readonly target: CleanupTarget;
  readonly trigger: CleanupTrigger;
}

interface RuntimeOpBase {
  readonly opId: string;
  readonly opType: RuntimeOpType;
  readonly cleanup: readonly CleanupRegistrationContract[];
}

export interface MountOverlayRootOp extends RuntimeOpBase {
  readonly opType: 'mount_overlay_root';
  readonly containerId: string;
}

export interface ToolbarRuntimeItem {
  readonly id: string;
  readonly label: string;
  readonly selector: string;
  readonly behavior: BehaviorType;
}

export interface InsertToolbarOp extends RuntimeOpBase {
  readonly opType: 'insert_toolbar';
  readonly items: readonly ToolbarRuntimeItem[];
}

export interface JumpLinkRuntimeItem {
  readonly id: string;
  readonly label: string;
  readonly selector: string;
}

export interface InsertJumpLinksOp extends RuntimeOpBase {
  readonly opType: 'insert_jump_links';
  readonly links: readonly JumpLinkRuntimeItem[];
}

export interface ApplyThemeTokensOp extends RuntimeOpBase {
  readonly opType: 'apply_theme_tokens';
  readonly preset: 'light' | 'dark' | 'high_contrast' | 'soft';
  readonly tokens?: NumericTokenSet;
}

export interface StylePatchRuntimeRule {
  readonly selector: string;
  readonly declarations: Readonly<Record<string, string>>;
}

export interface ApplyStylePatchOp extends RuntimeOpBase {
  readonly opType: 'apply_style_patch';
  readonly rules: readonly StylePatchRuntimeRule[];
}

export type RuntimeOp =
  | MountOverlayRootOp
  | InsertToolbarOp
  | InsertJumpLinksOp
  | ApplyThemeTokensOp
  | ApplyStylePatchOp;

export type RuntimeBatchMode = 'serial' | 'parallel';

export interface RuntimeOpBatch {
  readonly batchId: string;
  readonly mode: RuntimeBatchMode;
  readonly cleanupBeforeApply: boolean;
  readonly opIds: readonly string[];
}

export type RuntimeReapplyStrategy = 'replace_existing' | 'append_only';

export interface RuntimeReapplyLifecycle {
  readonly strategy: RuntimeReapplyStrategy;
  readonly cleanupBeforeReapply: boolean;
  readonly supportsSpaNavigation: boolean;
}

export interface RuntimeExecutionPlan {
  readonly executionId: string;
  readonly sourcePlanId: string;
  readonly generatedAt: string;
  readonly ops: readonly RuntimeOp[];
  readonly batches: readonly RuntimeOpBatch[];
  readonly lifecycle: RuntimeReapplyLifecycle;
}

export interface PlanExecutionHandle {
  readonly executionId: string;
  readonly sourcePlanId: string;
  readonly active: boolean;
  dispose(): void;
}
