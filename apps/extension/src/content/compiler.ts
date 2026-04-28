import type {
  EnhancementPlan,
  EnhancementPlanItem,
  RuntimeExecutionPlan,
  RuntimeOp,
} from '@pageaura/shared-types';
import { compileJumpLinks } from './compileJumpLinks';
import { compileStylePatch } from './compileStylePatch';
import { compileThemePatch } from './compileThemePatch';
import { compileToolbar } from './compileToolbar';

const DEFAULT_OVERLAY_CONTAINER_ID = 'pageaura-overlay-root';

const makeEnhancementOpId = (enhancementId: string, enhancementIndex: number): string => {
  return `enhancement-${enhancementIndex + 1}-${enhancementId}`;
};

const compileEnhancement = (
  enhancement: EnhancementPlanItem,
  enhancementIndex: number,
): RuntimeOp | null => {
  const opId = makeEnhancementOpId(enhancement.id, enhancementIndex);

  switch (enhancement.type) {
    case 'insert_toolbar':
      return compileToolbar(enhancement, opId);

    case 'jump_links':
      return compileJumpLinks(enhancement, opId);

    case 'theme_patch':
      return compileThemePatch(enhancement, opId);

    case 'style_patch':
      return compileStylePatch(enhancement, opId);

    default:
      return null;
  }
};

const compileRuntimeOps = (plan: EnhancementPlan): readonly RuntimeOp[] => {
  const enhancementOps = plan.enhancements
    .map((enhancement, index) => compileEnhancement(enhancement, index))
    .filter((op): op is RuntimeOp => op !== null);

  return [
    {
      opId: 'mount-overlay-root',
      opType: 'mount_overlay_root',
      containerId: DEFAULT_OVERLAY_CONTAINER_ID,
    },
    ...enhancementOps,
  ];
};

export const compileRuntimeExecutionPlan = (plan: EnhancementPlan): RuntimeExecutionPlan => {
  return {
    executionId: `execution-${plan.planId}`,
    sourcePlanId: plan.planId,
    generatedAt: plan.generatedAt,
    ops: compileRuntimeOps(plan),
  };
};
