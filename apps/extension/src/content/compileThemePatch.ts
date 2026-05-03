import type { ApplyThemeTokensOp, ThemePatchEnhancement } from '@pageaura/shared-types';
import { normalizeAndClampThemeTokens } from './themeTokenCompiler';

type ApplyThemeTokensOpDraft = Omit<ApplyThemeTokensOp, 'cleanup'>;

export const compileThemePatch = (
  enhancement: ThemePatchEnhancement,
  opId: string,
): ApplyThemeTokensOpDraft => {
  const { tokens } = normalizeAndClampThemeTokens(enhancement.patch.tokens);

  return {
    opId,
    opType: 'apply_theme_tokens',
    preset: enhancement.patch.preset,
    tokens,
  };
};
