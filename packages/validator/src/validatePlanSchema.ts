import type {
  BehaviorType,
  EnhancementPlan,
  EnhancementPlanItem,
  EnhancementType,
  JumpLinkPlan,
  NumericTokenSet,
  StylePatchPlan,
  ThemePatchPlan,
  ToolbarItemPlan,
} from '@pageaura/shared-types';
import { clampNumericTokens } from './validateTokens';

const MAX_TOOLBAR_ACTIONS = 8;
const MAX_JUMP_LINKS = 12;

const SUPPORTED_ENHANCEMENT_TYPES: readonly EnhancementType[] = [
  'insert_toolbar',
  'jump_links',
  'theme_patch',
  'style_patch',
];

const THEME_PRESETS: readonly ThemePatchPlan['preset'][] = [
  'light',
  'dark',
  'high_contrast',
  'soft',
];

const BEHAVIOR_TYPES: readonly BehaviorType[] = ['focus', 'scroll', 'click'];

const TOP_LEVEL_KEYS = ['planId', 'snapshotId', 'generatedAt', 'summary', 'enhancements'] as const;

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: ValidationSeverity;
}

export interface ValidatePlanSchemaResult {
  readonly ok: boolean;
  readonly plan?: EnhancementPlan;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasOnlyKnownKeys = (
  candidate: Record<string, unknown>,
  knownKeys: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void => {
  const known = new Set(knownKeys);
  for (const key of Object.keys(candidate)) {
    if (!known.has(key)) {
      issues.push({
        code: 'UNKNOWN_FIELD',
        path: `${path}.${key}`,
        message: `Unknown field \"${key}\" is not allowed.`,
        severity: 'error',
      });
    }
  }
};

const addRequiredFieldIssue = (issues: ValidationIssue[], path: string, field: string): void => {
  issues.push({
    code: 'REQUIRED_FIELD_MISSING',
    path: `${path}.${field}`,
    message: `Missing required field \"${field}\".`,
    severity: 'error',
  });
};

const validateToolbarItems = (
  items: unknown,
  path: string,
  issues: ValidationIssue[],
): ToolbarItemPlan[] => {
  if (!Array.isArray(items)) {
    issues.push({
      code: 'INVALID_TYPE',
      path,
      message: 'Toolbar items must be an array.',
      severity: 'error',
    });
    return [];
  }

  if (items.length > MAX_TOOLBAR_ACTIONS) {
    issues.push({
      code: 'MAX_COUNT_EXCEEDED',
      path,
      message: `Toolbar action count exceeds max of ${MAX_TOOLBAR_ACTIONS}.`,
      severity: 'error',
    });
  }

  return items
    .map((item, index) => {
      const itemPath = `${path}[${index}]`;
      if (!isRecord(item)) {
        issues.push({
          code: 'INVALID_TYPE',
          path: itemPath,
          message: 'Toolbar item must be an object.',
          severity: 'error',
        });
        return null;
      }

      const requiredKeys = ['id', 'label', 'selector', 'behavior'] as const;
      for (const key of requiredKeys) {
        if (item[key] === undefined) {
          addRequiredFieldIssue(issues, itemPath, key);
        }
      }

      if (
        !isNonEmptyString(item.id) ||
        !isNonEmptyString(item.label) ||
        !isNonEmptyString(item.selector)
      ) {
        issues.push({
          code: 'INVALID_FIELD',
          path: itemPath,
          message: 'Toolbar item id, label, and selector must be non-empty strings.',
          severity: 'error',
        });
      }

      if (!BEHAVIOR_TYPES.includes(item.behavior as BehaviorType)) {
        issues.push({
          code: 'UNSUPPORTED_BEHAVIOR',
          path: `${itemPath}.behavior`,
          message: `Behavior must be one of: ${BEHAVIOR_TYPES.join(', ')}.`,
          severity: 'error',
        });
      }

      return {
        id: String(item.id),
        label: String(item.label),
        selector: String(item.selector),
        behavior: item.behavior as BehaviorType,
      };
    })
    .filter((item): item is ToolbarItemPlan => item !== null);
};

const validateJumpLinks = (
  links: unknown,
  path: string,
  issues: ValidationIssue[],
): JumpLinkPlan[] => {
  if (!Array.isArray(links)) {
    issues.push({
      code: 'INVALID_TYPE',
      path,
      message: 'Jump links must be an array.',
      severity: 'error',
    });
    return [];
  }

  if (links.length > MAX_JUMP_LINKS) {
    issues.push({
      code: 'MAX_COUNT_EXCEEDED',
      path,
      message: `Jump link count exceeds max of ${MAX_JUMP_LINKS}.`,
      severity: 'error',
    });
  }

  return links
    .map((link, index) => {
      const linkPath = `${path}[${index}]`;
      if (!isRecord(link)) {
        issues.push({
          code: 'INVALID_TYPE',
          path: linkPath,
          message: 'Jump link must be an object.',
          severity: 'error',
        });
        return null;
      }

      const requiredKeys = ['id', 'label', 'selector'] as const;
      for (const key of requiredKeys) {
        if (link[key] === undefined) {
          addRequiredFieldIssue(issues, linkPath, key);
        }
      }

      if (
        !isNonEmptyString(link.id) ||
        !isNonEmptyString(link.label) ||
        !isNonEmptyString(link.selector)
      ) {
        issues.push({
          code: 'INVALID_FIELD',
          path: linkPath,
          message: 'Jump link id, label, and selector must be non-empty strings.',
          severity: 'error',
        });
      }

      return {
        id: String(link.id),
        label: String(link.label),
        selector: String(link.selector),
      };
    })
    .filter((link): link is JumpLinkPlan => link !== null);
};

const validateThemePatch = (
  patch: unknown,
  path: string,
  issues: ValidationIssue[],
  warnings: ValidationIssue[],
): ThemePatchPlan | null => {
  if (!isRecord(patch)) {
    issues.push({
      code: 'INVALID_TYPE',
      path,
      message: 'Theme patch must be an object.',
      severity: 'error',
    });
    return null;
  }

  if (!THEME_PRESETS.includes(patch.preset as ThemePatchPlan['preset'])) {
    issues.push({
      code: 'INVALID_THEME_PRESET',
      path: `${path}.preset`,
      message: `Theme preset must be one of: ${THEME_PRESETS.join(', ')}.`,
      severity: 'error',
    });
    return null;
  }

  if (patch.tokens === undefined) {
    return {
      preset: patch.preset as ThemePatchPlan['preset'],
    };
  }

  if (!isRecord(patch.tokens)) {
    issues.push({
      code: 'INVALID_TYPE',
      path: `${path}.tokens`,
      message: 'Theme patch tokens must be an object when provided.',
      severity: 'error',
    });
    return null;
  }

  const allTokenValuesAreNumbers = Object.values(patch.tokens).every(
    (value) => typeof value === 'number',
  );
  if (!allTokenValuesAreNumbers) {
    issues.push({
      code: 'INVALID_TOKEN_VALUE',
      path: `${path}.tokens`,
      message: 'All numeric tokens must be numbers.',
      severity: 'error',
    });
    return null;
  }

  const tokenResult = clampNumericTokens(patch.tokens as NumericTokenSet);
  for (const token of tokenResult.clamped) {
    warnings.push({
      code: 'TOKEN_CLAMPED',
      path: `${path}.tokens.${token}`,
      message: `Token \"${token}\" was out of range and has been clamped.`,
      severity: 'warning',
    });
  }

  return {
    preset: patch.preset as ThemePatchPlan['preset'],
    tokens: tokenResult.tokens,
  };
};

const validateStylePatch = (
  patch: unknown,
  path: string,
  issues: ValidationIssue[],
): StylePatchPlan | null => {
  if (!isRecord(patch) || !Array.isArray(patch.rules)) {
    issues.push({
      code: 'INVALID_TYPE',
      path,
      message: 'Style patch must be an object with a rules array.',
      severity: 'error',
    });
    return null;
  }

  const rules = patch.rules
    .map((rule, index) => {
      const rulePath = `${path}.rules[${index}]`;
      if (!isRecord(rule) || !isNonEmptyString(rule.selector) || !isRecord(rule.declarations)) {
        issues.push({
          code: 'INVALID_STYLE_RULE',
          path: rulePath,
          message: 'Each style rule must contain selector and declarations fields.',
          severity: 'error',
        });
        return null;
      }

      const declarations = Object.fromEntries(
        Object.entries(rule.declarations).filter(([, value]) => typeof value === 'string'),
      );

      if (Object.keys(declarations).length !== Object.keys(rule.declarations).length) {
        issues.push({
          code: 'INVALID_STYLE_DECLARATIONS',
          path: `${rulePath}.declarations`,
          message: 'Style declarations must be a string-to-string map.',
          severity: 'error',
        });
      }

      return {
        selector: rule.selector,
        declarations,
      };
    })
    .filter((rule): rule is StylePatchPlan['rules'][number] => rule !== null);

  return { rules };
};

const validateEnhancementItem = (
  item: unknown,
  index: number,
  issues: ValidationIssue[],
  warnings: ValidationIssue[],
): EnhancementPlanItem | null => {
  const itemPath = `$.enhancements[${index}]`;

  if (!isRecord(item)) {
    issues.push({
      code: 'INVALID_TYPE',
      path: itemPath,
      message: 'Enhancement item must be an object.',
      severity: 'error',
    });
    return null;
  }

  const requiredBaseKeys = ['id', 'type', 'title'] as const;
  for (const key of requiredBaseKeys) {
    if (item[key] === undefined) {
      addRequiredFieldIssue(issues, itemPath, key);
    }
  }

  if (!isNonEmptyString(item.id) || !isNonEmptyString(item.title)) {
    issues.push({
      code: 'INVALID_FIELD',
      path: itemPath,
      message: 'Enhancement id and title must be non-empty strings.',
      severity: 'error',
    });
  }

  if (!SUPPORTED_ENHANCEMENT_TYPES.includes(item.type as EnhancementType)) {
    issues.push({
      code: 'UNSUPPORTED_ENHANCEMENT_TYPE',
      path: `${itemPath}.type`,
      message: `Enhancement type must be one of: ${SUPPORTED_ENHANCEMENT_TYPES.join(', ')}.`,
      severity: 'error',
    });
    return null;
  }

  if (item.rationale !== undefined && !isNonEmptyString(item.rationale)) {
    issues.push({
      code: 'INVALID_FIELD',
      path: `${itemPath}.rationale`,
      message: 'Enhancement rationale must be a non-empty string when provided.',
      severity: 'error',
    });
  }

  if (item.optional !== undefined && typeof item.optional !== 'boolean') {
    issues.push({
      code: 'INVALID_FIELD',
      path: `${itemPath}.optional`,
      message: 'Enhancement optional must be a boolean when provided.',
      severity: 'error',
    });
  }

  switch (item.type) {
    case 'insert_toolbar': {
      const normalizedItems = validateToolbarItems(item.items, `${itemPath}.items`, issues);
      return {
        id: String(item.id),
        type: 'insert_toolbar',
        title: String(item.title),
        rationale: item.rationale as string | undefined,
        optional: item.optional as boolean | undefined,
        items: normalizedItems,
      };
    }

    case 'jump_links': {
      const normalizedLinks = validateJumpLinks(item.links, `${itemPath}.links`, issues);
      return {
        id: String(item.id),
        type: 'jump_links',
        title: String(item.title),
        rationale: item.rationale as string | undefined,
        optional: item.optional as boolean | undefined,
        links: normalizedLinks,
      };
    }

    case 'theme_patch': {
      const patch = validateThemePatch(item.patch, `${itemPath}.patch`, issues, warnings);
      if (!patch) {
        return null;
      }

      return {
        id: String(item.id),
        type: 'theme_patch',
        title: String(item.title),
        rationale: item.rationale as string | undefined,
        optional: item.optional as boolean | undefined,
        patch,
      };
    }

    case 'style_patch': {
      const patch = validateStylePatch(item.patch, `${itemPath}.patch`, issues);
      if (!patch) {
        return null;
      }

      return {
        id: String(item.id),
        type: 'style_patch',
        title: String(item.title),
        rationale: item.rationale as string | undefined,
        optional: item.optional as boolean | undefined,
        patch,
      };
    }

    default:
      return null;
  }
};

export const validatePlanSchema = (raw: unknown): ValidatePlanSchemaResult => {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isRecord(raw)) {
    return {
      ok: false,
      errors: [
        {
          code: 'INVALID_TYPE',
          path: '$',
          message: 'Enhancement plan payload must be an object.',
          severity: 'error',
        },
      ],
      warnings,
    };
  }

  hasOnlyKnownKeys(raw, TOP_LEVEL_KEYS, '$', issues);

  for (const key of TOP_LEVEL_KEYS) {
    if (raw[key] === undefined) {
      addRequiredFieldIssue(issues, '$', key);
    }
  }

  if (!isNonEmptyString(raw.planId)) {
    issues.push({
      code: 'INVALID_FIELD',
      path: '$.planId',
      message: 'planId must be a non-empty string.',
      severity: 'error',
    });
  }

  if (!isNonEmptyString(raw.snapshotId)) {
    issues.push({
      code: 'INVALID_FIELD',
      path: '$.snapshotId',
      message: 'snapshotId must be a non-empty string.',
      severity: 'error',
    });
  }

  if (!isNonEmptyString(raw.generatedAt) || Number.isNaN(Date.parse(raw.generatedAt))) {
    issues.push({
      code: 'INVALID_FIELD',
      path: '$.generatedAt',
      message: 'generatedAt must be an ISO-8601 datetime string.',
      severity: 'error',
    });
  }

  if (!isNonEmptyString(raw.summary)) {
    issues.push({
      code: 'INVALID_FIELD',
      path: '$.summary',
      message: 'summary must be a non-empty string.',
      severity: 'error',
    });
  }

  const enhancements: EnhancementPlanItem[] = [];
  if (!Array.isArray(raw.enhancements)) {
    issues.push({
      code: 'INVALID_TYPE',
      path: '$.enhancements',
      message: 'enhancements must be an array.',
      severity: 'error',
    });
  } else {
    raw.enhancements.forEach((item, index) => {
      const validatedItem = validateEnhancementItem(item, index, issues, warnings);
      if (validatedItem) {
        enhancements.push(validatedItem);
      }
    });
  }

  if (issues.length > 0) {
    return {
      ok: false,
      errors: issues,
      warnings,
    };
  }

  return {
    ok: true,
    plan: {
      planId: String(raw.planId),
      snapshotId: String(raw.snapshotId),
      generatedAt: String(raw.generatedAt),
      summary: String(raw.summary),
      enhancements,
    },
    errors: [],
    warnings,
  };
};
