import type {
  ApplyStylePatchOp,
  StylePatchEnhancement,
  StylePatchRuntimeRule,
} from '@pageaura/shared-types';
import { resolveRuntimeSelector } from './semanticResolvers';

type ApplyStylePatchOpDraft = Omit<ApplyStylePatchOp, 'cleanup'>;

const normalizeRule = (
  rule: StylePatchEnhancement['patch']['rules'][number],
): StylePatchRuntimeRule | null => {
  const resolvedSelector = resolveRuntimeSelector(rule.selector);
  if (!resolvedSelector) {
    return null;
  }

  const sortedEntries = Object.entries(rule.declarations)
    .map(([key, value]) => [key.trim().toLowerCase(), value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  if (!sortedEntries.length) {
    return null;
  }

  return {
    selector: resolvedSelector,
    declarations: Object.fromEntries(sortedEntries),
  };
};

export const compileStylePatch = (
  enhancement: StylePatchEnhancement,
  opId: string,
): ApplyStylePatchOpDraft => {
  const rules = enhancement.patch.rules
    .map(normalizeRule)
    .filter((rule): rule is StylePatchRuntimeRule => rule !== null);

  return {
    opId,
    opType: 'apply_style_patch',
    rules,
  };
};
