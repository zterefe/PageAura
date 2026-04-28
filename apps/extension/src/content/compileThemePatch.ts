import type { ApplyThemeTokensOp, ThemePatchEnhancement } from '@pageaura/shared-types';
import { normalizeAndClampThemeTokens } from './themeTokenCompiler';

export const compileThemePatch = (
  enhancement: ThemePatchEnhancement,
  opId: string,
): ApplyThemeTokensOp => {
  const { tokens } = normalizeAndClampThemeTokens(enhancement.patch.tokens);

  return {
    opId,
    opType: 'apply_theme_tokens',
    preset: enhancement.patch.preset,
    tokens,
  };
};
