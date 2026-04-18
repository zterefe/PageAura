export type EnhancementType = 'insert_toolbar' | 'jump_links' | 'theme_patch' | 'style_patch';
export type BehaviorType = 'focus' | 'scroll' | 'click';

export interface NumericTokenSet {
  readonly contrast?: number;
  readonly fontScale?: number;
  readonly spacing?: number;
  readonly radius?: number;
}

export interface ToolbarItemPlan {
  readonly id: string;
  readonly label: string;
  readonly selector: string;
  readonly behavior: BehaviorType;
}

export interface JumpLinkPlan {
  readonly id: string;
  readonly label: string;
  readonly selector: string;
}

export interface ThemePatchPlan {
  readonly preset: 'light' | 'dark' | 'high_contrast' | 'soft';
  readonly tokens?: NumericTokenSet;
}

export interface StylePatchRule {
  readonly selector: string;
  readonly declarations: Readonly<Record<string, string>>;
}

export interface StylePatchPlan {
  readonly rules: readonly StylePatchRule[];
}

interface EnhancementBase {
  readonly id: string;
  readonly type: EnhancementType;
  readonly title: string;
  readonly rationale?: string;
  readonly optional?: boolean;
}

export interface InsertToolbarEnhancement extends EnhancementBase {
  readonly type: 'insert_toolbar';
  readonly items: readonly ToolbarItemPlan[];
}

export interface JumpLinksEnhancement extends EnhancementBase {
  readonly type: 'jump_links';
  readonly links: readonly JumpLinkPlan[];
}

export interface ThemePatchEnhancement extends EnhancementBase {
  readonly type: 'theme_patch';
  readonly patch: ThemePatchPlan;
}

export interface StylePatchEnhancement extends EnhancementBase {
  readonly type: 'style_patch';
  readonly patch: StylePatchPlan;
}

export type EnhancementPlanItem =
  | InsertToolbarEnhancement
  | JumpLinksEnhancement
  | ThemePatchEnhancement
  | StylePatchEnhancement;

export interface EnhancementPlan {
  readonly planId: string;
  readonly snapshotId: string;
  readonly generatedAt: string;
  readonly summary: string;
  readonly enhancements: readonly EnhancementPlanItem[];
}
