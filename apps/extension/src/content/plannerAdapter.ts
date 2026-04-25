import type {
  EnhancementPlan,
  EnhancementPlanItem,
  Planner,
  PlannerCapabilities,
  PlannerErrorContract,
  PlannerInput,
  PlannerResult,
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

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isBehaviorType = (value: unknown): value is 'focus' | 'scroll' | 'click' =>
  value === 'focus' || value === 'scroll' || value === 'click';

const isEnhancementBase = (
  value: Record<string, unknown>,
): value is Record<string, unknown> & {
  id: string;
  type: string;
  title: string;
  rationale?: string;
  optional?: boolean;
} => {
  if (!isString(value.id) || !isString(value.type) || !isString(value.title)) {
    return false;
  }

  if (value.rationale !== undefined && !isString(value.rationale)) {
    return false;
  }

  if (value.optional !== undefined && !isBoolean(value.optional)) {
    return false;
  }

  return true;
};

const isToolbarItemPlan = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.label) &&
    isString(value.selector) &&
    isBehaviorType(value.behavior)
  );
};

const isJumpLinkPlan = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.id) && isString(value.label) && isString(value.selector);
};

const isNumericTokenSet = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  const tokenKeys = ['contrast', 'fontScale', 'spacing', 'radius'] as const;
  return tokenKeys.every((key) => value[key] === undefined || typeof value[key] === 'number');
};

const isThemePatchPlan = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.preset !== 'light' &&
    value.preset !== 'dark' &&
    value.preset !== 'high_contrast' &&
    value.preset !== 'soft'
  ) {
    return false;
  }

  if (value.tokens !== undefined && !isNumericTokenSet(value.tokens)) {
    return false;
  }

  return true;
};

const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => isString(entry));
};

const isStylePatchRule = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return isString(value.selector) && isStringRecord(value.declarations);
};

const isStylePatchPlan = (value: unknown): boolean => {
  if (!isRecord(value) || !Array.isArray(value.rules)) {
    return false;
  }

  return value.rules.every(isStylePatchRule);
};

const isEnhancementItem = (value: unknown): value is EnhancementPlanItem => {
  if (!isRecord(value) || !isEnhancementBase(value)) {
    return false;
  }

  switch (value.type) {
    case 'insert_toolbar':
      return Array.isArray(value.items) && value.items.every(isToolbarItemPlan);

    case 'jump_links':
      return Array.isArray(value.links) && value.links.every(isJumpLinkPlan);

    case 'theme_patch':
      return isThemePatchPlan(value.patch);

    case 'style_patch':
      return isStylePatchPlan(value.patch);

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
    !isString(planId) ||
    !isString(snapshotId) ||
    !isString(generatedAt) ||
    !isString(summary) ||
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