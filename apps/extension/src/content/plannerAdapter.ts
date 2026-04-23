import type {
  EnhancementPlan,
  EnhancementPlanItem,
  Planner,
  PlannerCapabilities,
  PlannerErrorContract,
  PlannerInput,
  PlannerResult,
} from '@pageaura/shared-types';
import type {
  InsertToolbarEnhancement,
  JumpLinksEnhancement,
  StylePatchEnhancement,
  ThemePatchEnhancement,
} from '@pageaura/shared-types';
import type { PageSnapshot } from '@pageaura/shared-types';

export const DEFAULT_PLANNER_CAPABILITIES: PlannerCapabilities = {
  mode: 'safe',
  allowedEnhancementTypes: ['insert_toolbar', 'jump_links', 'theme_patch', 'style_patch'],
  maxEnhancements: 4,
  includeRationale: true,
};

export const buildPlannerInput = (
  snapshot: PageSnapshot,
  capabilities: PlannerCapabilities = DEFAULT_PLANNER_CAPABILITIES,
): PlannerInput => ({
  snapshot,
  capabilities,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isEnhancementItem = (value: unknown): value is EnhancementPlanItem => {
  if (!isRecord(value) || typeof value.type !== 'string' || typeof value.id !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'insert_toolbar': {
      const item = value as InsertToolbarEnhancement;
      return Array.isArray(item.items);
    }
    case 'jump_links': {
      const item = value as JumpLinksEnhancement;
      return Array.isArray(item.links);
    }
    case 'theme_patch': {
      const item = value as ThemePatchEnhancement;
      return isRecord(item.patch);
    }
    case 'style_patch': {
      const item = value as StylePatchEnhancement;
      return isRecord(item.patch) && Array.isArray(item.patch.rules);
    }
    default:
      return false;
  }
};

export const parsePlannerResponse = (raw: unknown): EnhancementPlan => {
  if (raw === null || raw === undefined || raw === '') {
    throw new Error('Planner returned an empty response payload.');
  }

  const candidate: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (!isRecord(candidate)) {
    throw new Error('Planner response must be an object payload.');
  }

  const { planId, snapshotId, generatedAt, summary, enhancements } = candidate;

  if (
    typeof planId !== 'string' ||
    typeof snapshotId !== 'string' ||
    typeof generatedAt !== 'string' ||
    typeof summary !== 'string' ||
    !Array.isArray(enhancements)
  ) {
    throw new Error('Planner response is missing required enhancement plan fields.');
  }

  if (!enhancements.every(isEnhancementItem)) {
    throw new Error('Planner response enhancements contain unsupported or invalid entries.');
  }

  return {
    planId,
    snapshotId,
    generatedAt,
    summary,
    enhancements,
  };
};

const toPlannerError = (
  code: PlannerErrorContract['code'],
  message: string,
  plannerId: string,
  cause?: unknown,
): PlannerErrorContract => ({
  code,
  message,
  plannerId,
  cause,
});

export const runPlanner = async (
  planner: Planner,
  snapshot: PageSnapshot,
  capabilities: PlannerCapabilities = DEFAULT_PLANNER_CAPABILITIES,
): Promise<PlannerResult> => {
  try {
    const raw = await planner.plan(buildPlannerInput(snapshot, capabilities));

    try {
      return {
        ok: true,
        plan: parsePlannerResponse(raw),
      };
    } catch (error) {
      return {
        ok: false,
        error: toPlannerError(
          'PLANNER_INVALID_OUTPUT',
          'Planner output could not be parsed into a valid enhancement plan.',
          planner.id,
          error,
        ),
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: toPlannerError(
        'PLANNER_REQUEST_FAILED',
        'Planner execution failed.',
        planner.id,
        error,
      ),
    };
  }
};
