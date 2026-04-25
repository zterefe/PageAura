import type { NumericTokenSet } from '@pageaura/shared-types';

export interface NumericTokenRange {
  readonly min: number;
  readonly max: number;
}

export const TOKEN_BOUNDS: Readonly<Record<keyof NumericTokenSet, NumericTokenRange>> = {
  contrast: { min: 0.5, max: 2 },
  fontScale: { min: 0.75, max: 1.5 },
  spacing: { min: 0, max: 2 },
  radius: { min: 0, max: 24 },
};

export interface ClampTokenResult {
  readonly tokens: NumericTokenSet;
  readonly clamped: readonly (keyof NumericTokenSet)[];
}

export const clampNumericTokens = (tokens: NumericTokenSet): ClampTokenResult => {
  const normalized: Record<string, number> = {};
  const clamped: (keyof NumericTokenSet)[] = [];

  for (const key of Object.keys(TOKEN_BOUNDS) as (keyof NumericTokenSet)[]) {
    const rawValue = tokens[key];

    if (rawValue === undefined) {
      continue;
    }

    const bounds = TOKEN_BOUNDS[key];
    const nextValue = Math.min(bounds.max, Math.max(bounds.min, rawValue));
    normalized[key] = nextValue;

    if (nextValue !== rawValue) {
      clamped.push(key);
    }
  }

  return {
    tokens: normalized as NumericTokenSet,
    clamped,
  };
};
