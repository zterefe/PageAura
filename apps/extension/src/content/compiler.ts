import type {
  CleanupRegistrationContract,
  EnhancementPlan,
  EnhancementPlanItem,
  RuntimeExecutionPlan,
  RuntimeOp,
  RuntimeOpBatch,
  RuntimeOpType,
} from '@pageaura/shared-types';
import { compileJumpLinks } from './compileJumpLinks';
import { compileStylePatch } from './compileStylePatch';
import { compileThemePatch } from './compileThemePatch';
import { compileToolbar } from './compileToolbar';

const DEFAULT_OVERLAY_CONTAINER_ID = 'pageaura-overlay-root';

const makeEnhancementOpId = (enhancementId: string, enhancementIndex: number): string => {
  return `enhancement-${enhancementIndex + 1}-${enhancementId}`;
};

const buildCleanupContracts = (
  opId: string,
  opType: RuntimeOpType,
): readonly CleanupRegistrationContract[] => {
  switch (opType) {
    case 'mount_overlay_root':
      return [
        {
          cleanupId: `${opId}:overlay-node`,
          target: 'nodes',
          trigger: 'before_rerun',
        },
      ];

    case 'insert_toolbar':
    case 'insert_jump_links':
      return [
        {
          cleanupId: `${opId}:ui-nodes`,
          target: 'nodes',
          trigger: 'before_rerun',
        },
        {
          cleanupId: `${opId}:ui-listeners`,
          target: 'listeners',
          trigger: 'on_dispose',
        },
      ];

    case 'apply_theme_tokens':
    case 'apply_style_patch':
      return [
        {
          cleanupId: `${opId}:styles`,
          target: 'styles',
          trigger: 'before_rerun',
        },
      ];

    default:
      return [];
  }
};

const withCleanupContracts = (op: RuntimeOp): RuntimeOp => {
  return {
    ...op,
    cleanup: buildCleanupContracts(op.opId, op.opType),
  };
};

const compileEnhancement = (
  enhancement: EnhancementPlanItem,
  enhancementIndex: number,
): RuntimeOp | null => {
  const opId = makeEnhancementOpId(enhancement.id, enhancementIndex);

  switch (enhancement.type) {
    case 'insert_toolbar':
      return withCleanupContracts(compileToolbar(enhancement, opId));

    case 'jump_links':
      return withCleanupContracts(compileJumpLinks(enhancement, opId));

    case 'theme_patch':
      return withCleanupContracts(compileThemePatch(enhancement, opId));

    case 'style_patch':
      return withCleanupContracts(compileStylePatch(enhancement, opId));

    default:
      return null;
  }
};

const buildRuntimeBatches = (ops: readonly RuntimeOp[]): readonly RuntimeOpBatch[] => {
  const overlayBatchOpIds = ops
    .filter((op) =>
      ['mount_overlay_root', 'insert_toolbar', 'insert_jump_links'].includes(op.opType),
    )
    .map((op) => op.opId);

  const patchBatchOpIds = ops
    .filter((op) => ['apply_theme_tokens', 'apply_style_patch'].includes(op.opType))
    .map((op) => op.opId);

  const batches: RuntimeOpBatch[] = [];

  if (overlayBatchOpIds.length > 0) {
    batches.push({
      batchId: 'overlay-ui-batch',
      mode: 'serial',
      cleanupBeforeApply: true,
      opIds: overlayBatchOpIds,
    });
  }

  if (patchBatchOpIds.length > 0) {
    batches.push({
      batchId: 'patch-batch',
      mode: 'parallel',
      cleanupBeforeApply: true,
      opIds: patchBatchOpIds,
    });
  }

  return batches;
};

const compileRuntimeOps = (plan: EnhancementPlan): readonly RuntimeOp[] => {
  const enhancementOps = plan.enhancements
    .map((enhancement, index) => compileEnhancement(enhancement, index))
    .filter((op): op is RuntimeOp => op !== null);

  const mountOverlayRootOp = withCleanupContracts({
    opId: 'mount-overlay-root',
    opType: 'mount_overlay_root',
    containerId: DEFAULT_OVERLAY_CONTAINER_ID,
  });

  return [mountOverlayRootOp, ...enhancementOps];
};

export const compileRuntimeExecutionPlan = (plan: EnhancementPlan): RuntimeExecutionPlan => {
  const ops = compileRuntimeOps(plan);

  return {
    executionId: `execution-${plan.planId}`,
    sourcePlanId: plan.planId,
    generatedAt: plan.generatedAt,
    ops,
    batches: buildRuntimeBatches(ops),
    lifecycle: {
      strategy: 'replace_existing',
      cleanupBeforeReapply: true,
      supportsSpaNavigation: true,
    },
  };
};
