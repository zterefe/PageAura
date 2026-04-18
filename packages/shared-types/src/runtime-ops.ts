import type { BehaviorType, NumericTokenSet } from './enhancement-plan';

export type RuntimeOpType =
  | 'mount_overlay_root'
  | 'insert_toolbar'
  | 'insert_jump_links'
  | 'apply_theme_tokens'
  | 'apply_style_patch';

interface RuntimeOpBase {
  readonly opId: string;
  readonly opType: RuntimeOpType;
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

export interface RuntimeExecutionPlan {
  readonly executionId: string;
  readonly sourcePlanId: string;
  readonly generatedAt: string;
  readonly ops: readonly RuntimeOp[];
}
