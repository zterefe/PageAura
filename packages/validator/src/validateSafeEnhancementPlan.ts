import type {
  BehaviorType,
  EnhancementPlan,
  EnhancementPlanItem,
  JumpLinksEnhancement,
  StylePatchEnhancement,
  ToolbarItemPlan,
} from '@pageaura/shared-types';
import type { ValidationIssue } from './validatePlanSchema';

const ALLOWED_BEHAVIORS: readonly BehaviorType[] = ['focus', 'scroll', 'click'];

const DESTRUCTIVE_ACTION_PATTERN =
  /\b(delete|remove|destroy|erase|clear\s+all|reset\s+all|drop\s+table|trash|unsubscribe|deactivate|close\s+account)\b/i;

export interface SafeEnhancementPlan extends EnhancementPlan {
  readonly skippedEnhancementIds: readonly string[];
}

export interface ValidateSafeEnhancementPlanOptions {
  readonly selectorExists: (selector: string) => boolean;
}

export interface ValidateSafeEnhancementPlanResult {
  readonly ok: boolean;
  readonly safePlan?: SafeEnhancementPlan;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

export interface SelectorQueryable {
  querySelector(selector: string): unknown;
}

const isDestructivePromotedAction = (item: ToolbarItemPlan): boolean => {
  const combined = `${item.label} ${item.id} ${item.selector}`;
  return DESTRUCTIVE_ACTION_PATTERN.test(combined);
};

const validateToolbarItem = (
  item: ToolbarItemPlan,
  path: string,
  options: ValidateSafeEnhancementPlanOptions,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): ToolbarItemPlan | null => {
  if (!ALLOWED_BEHAVIORS.includes(item.behavior)) {
    errors.push({
      code: 'UNSUPPORTED_BEHAVIOR',
      path: `${path}.behavior`,
      message: `Behavior must be one of: ${ALLOWED_BEHAVIORS.join(', ')}.`,
      severity: 'error',
    });
    return null;
  }

  if (!options.selectorExists(item.selector)) {
    warnings.push({
      code: 'SELECTOR_NOT_FOUND',
      path: `${path}.selector`,
      message: `Selector \"${item.selector}\" did not match the current DOM and was skipped.`,
      severity: 'warning',
    });
    return null;
  }

  if (isDestructivePromotedAction(item)) {
    errors.push({
      code: 'DESTRUCTIVE_ACTION_REJECTED',
      path,
      message: `Promoted action \"${item.label}\" appears destructive and is not allowed.`,
      severity: 'error',
    });
    return null;
  }

  return item;
};

const validateJumpLinksEnhancement = (
  enhancement: JumpLinksEnhancement,
  index: number,
  options: ValidateSafeEnhancementPlanOptions,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): JumpLinksEnhancement | null => {
  const filteredLinks = enhancement.links.filter((link, linkIndex) => {
    if (!options.selectorExists(link.selector)) {
      warnings.push({
        code: 'SELECTOR_NOT_FOUND',
        path: `$.enhancements[${index}].links[${linkIndex}].selector`,
        message: `Selector \"${link.selector}\" did not match the current DOM and was skipped.`,
        severity: 'warning',
      });
      return false;
    }

    return true;
  });

  if (filteredLinks.length > 0) {
    return {
      ...enhancement,
      links: filteredLinks,
    };
  }

  if (enhancement.optional) {
    warnings.push({
      code: 'OPTIONAL_ENHANCEMENT_SKIPPED',
      path: `$.enhancements[${index}]`,
      message:
        'Optional jump_links enhancement was skipped because no selectors matched the current DOM.',
      severity: 'warning',
    });
    return null;
  }

  errors.push({
    code: 'ENHANCEMENT_HAS_NO_VALID_TARGETS',
    path: `$.enhancements[${index}]`,
    message: 'jump_links enhancement has no selectors matching the current DOM.',
    severity: 'error',
  });
  return null;
};

const validateStylePatchEnhancement = (
  enhancement: StylePatchEnhancement,
  index: number,
  options: ValidateSafeEnhancementPlanOptions,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): StylePatchEnhancement | null => {
  const filteredRules = enhancement.patch.rules.filter((rule, ruleIndex) => {
    if (!options.selectorExists(rule.selector)) {
      warnings.push({
        code: 'SELECTOR_NOT_FOUND',
        path: `$.enhancements[${index}].patch.rules[${ruleIndex}].selector`,
        message: `Selector \"${rule.selector}\" did not match the current DOM and was skipped.`,
        severity: 'warning',
      });
      return false;
    }

    return true;
  });

  if (filteredRules.length > 0) {
    return {
      ...enhancement,
      patch: {
        ...enhancement.patch,
        rules: filteredRules,
      },
    };
  }

  if (enhancement.optional) {
    warnings.push({
      code: 'OPTIONAL_ENHANCEMENT_SKIPPED',
      path: `$.enhancements[${index}]`,
      message:
        'Optional style_patch enhancement was skipped because no selectors matched the current DOM.',
      severity: 'warning',
    });
    return null;
  }

  errors.push({
    code: 'ENHANCEMENT_HAS_NO_VALID_TARGETS',
    path: `$.enhancements[${index}]`,
    message: 'style_patch enhancement has no selectors matching the current DOM.',
    severity: 'error',
  });
  return null;
};

const validateEnhancement = (
  enhancement: EnhancementPlanItem,
  index: number,
  options: ValidateSafeEnhancementPlanOptions,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): EnhancementPlanItem | null => {
  switch (enhancement.type) {
    case 'insert_toolbar': {
      const filteredItems = enhancement.items
        .map((item, itemIndex) =>
          validateToolbarItem(
            item,
            `$.enhancements[${index}].items[${itemIndex}]`,
            options,
            errors,
            warnings,
          ),
        )
        .filter((item): item is ToolbarItemPlan => item !== null);

      if (filteredItems.length > 0) {
        return {
          ...enhancement,
          items: filteredItems,
        };
      }

      if (enhancement.optional) {
        warnings.push({
          code: 'OPTIONAL_ENHANCEMENT_SKIPPED',
          path: `$.enhancements[${index}]`,
          message:
            'Optional insert_toolbar enhancement was skipped because no safe actions remained after validation.',
          severity: 'warning',
        });
        return null;
      }

      errors.push({
        code: 'ENHANCEMENT_HAS_NO_VALID_TARGETS',
        path: `$.enhancements[${index}]`,
        message: 'insert_toolbar enhancement has no safe, valid actions after runtime validation.',
        severity: 'error',
      });
      return null;
    }

    case 'jump_links':
      return validateJumpLinksEnhancement(enhancement, index, options, errors, warnings);

    case 'style_patch':
      return validateStylePatchEnhancement(enhancement, index, options, errors, warnings);

    case 'theme_patch':
      return enhancement;

    default:
      return null;
  }
};

export const validateSafeEnhancementPlan = (
  plan: EnhancementPlan,
  options: ValidateSafeEnhancementPlanOptions,
): ValidateSafeEnhancementPlanResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const skippedEnhancementIds: string[] = [];

  const safeEnhancements = plan.enhancements
    .map((enhancement, index) => {
      const validated = validateEnhancement(enhancement, index, options, errors, warnings);
      if (!validated) {
        skippedEnhancementIds.push(enhancement.id);
      }
      return validated;
    })
    .filter((enhancement): enhancement is EnhancementPlanItem => enhancement !== null);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  return {
    ok: true,
    errors,
    warnings,
    safePlan: {
      ...plan,
      enhancements: safeEnhancements,
      skippedEnhancementIds,
    },
  };
};

export const createSelectorExistsFromQueryRoot = (
  root: SelectorQueryable,
): ((selector: string) => boolean) => {
  return (selector: string): boolean => {
    try {
      return root.querySelector(selector) !== null;
    } catch {
      return false;
    }
  };
};
