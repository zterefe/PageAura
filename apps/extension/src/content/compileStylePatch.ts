import type {
  ApplyStylePatchOp,
  StylePatchEnhancement,
  StylePatchRuntimeRule,
} from '@pageaura/shared-types';

const normalizeRule = (
  rule: StylePatchEnhancement['patch']['rules'][number],
): StylePatchRuntimeRule => {
  const sortedEntries = Object.entries(rule.declarations)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key.trim(), value.trim()] as const);

  return {
    selector: rule.selector.trim(),
    declarations: Object.fromEntries(sortedEntries),
  };
};

export const compileStylePatch = (
  enhancement: StylePatchEnhancement,
  opId: string,
): ApplyStylePatchOp => {
  return {
    opId,
    opType: 'apply_style_patch',
    rules: enhancement.patch.rules.map(normalizeRule),
  };
};
