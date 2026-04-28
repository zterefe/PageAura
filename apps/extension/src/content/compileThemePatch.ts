import type {
  ApplyThemeTokensOp,
  NumericTokenSet,
  ThemePatchEnhancement,
} from '@pageaura/shared-types';

const DEFAULT_THEME_TOKENS: Required<NumericTokenSet> = {
  contrast: 1,
  fontScale: 1,
  spacing: 1,
  radius: 1,
};

const normalizeTokens = (tokens: NumericTokenSet | undefined): Required<NumericTokenSet> => {
  return {
    contrast: tokens?.contrast ?? DEFAULT_THEME_TOKENS.contrast,
    fontScale: tokens?.fontScale ?? DEFAULT_THEME_TOKENS.fontScale,
    spacing: tokens?.spacing ?? DEFAULT_THEME_TOKENS.spacing,
    radius: tokens?.radius ?? DEFAULT_THEME_TOKENS.radius,
  };
};

export const compileThemePatch = (
  enhancement: ThemePatchEnhancement,
  opId: string,
): ApplyThemeTokensOp => {
  return {
    opId,
    opType: 'apply_theme_tokens',
    preset: enhancement.patch.preset,
    tokens: normalizeTokens(enhancement.patch.tokens),
  };
};
