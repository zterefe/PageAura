import type { NumericTokenSet } from '@pageaura/shared-types';

const DEFAULT_THEME_TOKENS: Required<NumericTokenSet> = {
  contrast: 1,
  fontScale: 1,
  spacing: 1,
  radius: 1,
};

const TOKEN_BOUNDS: Readonly<Record<keyof NumericTokenSet, { min: number; max: number }>> = {
  contrast: { min: 0.5, max: 2 },
  fontScale: { min: 0.75, max: 1.5 },
  spacing: { min: 0, max: 2 },
  radius: { min: 0, max: 24 },
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const normalizeTokenValue = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
};

export interface NormalizeThemeTokensResult {
  readonly tokens: Required<NumericTokenSet>;
  readonly clamped: readonly (keyof NumericTokenSet)[];
}

export const normalizeAndClampThemeTokens = (
  tokens: NumericTokenSet | undefined,
): NormalizeThemeTokensResult => {
  const normalizedMutable: {
    contrast: number;
    fontScale: number;
    spacing: number;
    radius: number;
  } = {
    contrast: normalizeTokenValue(tokens?.contrast, DEFAULT_THEME_TOKENS.contrast),
    fontScale: normalizeTokenValue(tokens?.fontScale, DEFAULT_THEME_TOKENS.fontScale),
    spacing: normalizeTokenValue(tokens?.spacing, DEFAULT_THEME_TOKENS.spacing),
    radius: normalizeTokenValue(tokens?.radius, DEFAULT_THEME_TOKENS.radius),
  };

  const clamped: (keyof NumericTokenSet)[] = [];

  for (const tokenName of Object.keys(TOKEN_BOUNDS) as (keyof NumericTokenSet)[]) {
    const bounds = TOKEN_BOUNDS[tokenName];
    const currentValue = normalizedMutable[tokenName];
    const boundedValue = clamp(currentValue, bounds.min, bounds.max);

    if (boundedValue !== currentValue) {
      clamped.push(tokenName);
      normalizedMutable[tokenName] = boundedValue;
    }
  }

  const normalized: Required<NumericTokenSet> = normalizedMutable;

  return {
    tokens: normalized,
    clamped,
  };
};

export const compileThemeTokensToCss = (
  preset: 'light' | 'dark' | 'high_contrast' | 'soft',
  tokens: Required<NumericTokenSet>,
): string => {
  const background =
    preset === 'dark'
      ? '#0f172a'
      : preset === 'high_contrast'
        ? '#000000'
        : preset === 'soft'
          ? '#f8fafc'
          : '#ffffff';

  const foreground =
    preset === 'dark' ? '#f8fafc' : preset === 'high_contrast' ? '#ffffff' : '#0f172a';

  return [
    ':root.pageaura-theme-patch {',
    `  --pageaura-token-contrast: ${tokens.contrast.toFixed(3)};`,
    `  --pageaura-token-font-scale: ${tokens.fontScale.toFixed(3)};`,
    `  --pageaura-token-spacing: ${tokens.spacing.toFixed(3)};`,
    `  --pageaura-token-radius: ${tokens.radius.toFixed(3)}px;`,
    `  --pageaura-theme-background: ${background};`,
    `  --pageaura-theme-foreground: ${foreground};`,
    '}',
    'html.pageaura-theme-patch,',
    'body.pageaura-theme-patch {',
    '  background-color: var(--pageaura-theme-background) !important;',
    '  color: var(--pageaura-theme-foreground) !important;',
    '  filter: contrast(var(--pageaura-token-contrast));',
    '  font-size: calc(1rem * var(--pageaura-token-font-scale));',
    '}',
    '.pageaura-theme-patch :is(button, input, select, textarea, a) {',
    '  border-radius: var(--pageaura-token-radius);',
    '}',
    '.pageaura-theme-patch :is(section, article, nav, aside, main, div) {',
    '  gap: calc(0.25rem * var(--pageaura-token-spacing));',
    '}',
  ].join('\n');
};
