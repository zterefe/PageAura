import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const bundleValidatorForTests = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pageaura-validator-test-'));

  const buildModule = async (entryPoint, outfileName) => {
    const outfile = join(tempDir, outfileName);
    await build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      absWorkingDir: process.cwd(),
    });
    return import(pathToFileURL(outfile).href);
  };

  const [schemaModule, tokenModule, safeModule] = await Promise.all([
    buildModule('packages/validator/src/validatePlanSchema.ts', 'validatePlanSchema.bundle.mjs'),
    buildModule('packages/validator/src/validateTokens.ts', 'validateTokens.bundle.mjs'),
    buildModule(
      'packages/validator/src/validateSafeEnhancementPlan.ts',
      'validateSafeEnhancementPlan.bundle.mjs',
    ),
  ]);

  return {
    validator: {
      validatePlanSchema: schemaModule.validatePlanSchema,
      clampNumericTokens: tokenModule.clampNumericTokens,
      createSelectorExistsFromQueryRoot: safeModule.createSelectorExistsFromQueryRoot,
      validateSafeEnhancementPlan: safeModule.validateSafeEnhancementPlan,
    },
    cleanup: async () => rm(tempDir, { recursive: true, force: true }),
  };
};

const basePlan = {
  planId: 'plan-1',
  snapshotId: 'snapshot-1',
  generatedAt: '2026-04-28T00:00:00.000Z',
  summary: 'deterministic tests',
  enhancements: [
    {
      id: 'toolbar-1',
      type: 'insert_toolbar',
      title: 'Toolbar',
      items: [{ id: 'focus-main', label: 'Focus main', selector: 'main', behavior: 'focus' }],
    },
    {
      id: 'theme-1',
      type: 'theme_patch',
      title: 'Theme',
      patch: { preset: 'soft', tokens: { contrast: 9, fontScale: 0.5, spacing: 1, radius: 100 } },
    },
  ],
};

test('validatePlanSchema rejects invalid plan payloads with deterministic errors', async () => {
  const { validator, cleanup } = await bundleValidatorForTests();

  try {
    const result = validator.validatePlanSchema({ ...basePlan, summary: '', extraField: true });

    assert.equal(result.ok, false);
    assert(
      result.errors.some(
        (issue) => issue.code === 'UNKNOWN_FIELD' && issue.path === '$.extraField',
      ),
    );
    assert(
      result.errors.some((issue) => issue.code === 'INVALID_FIELD' && issue.path === '$.summary'),
    );
  } finally {
    await cleanup();
  }
});

test('clampNumericTokens enforces bounds and reports clamped keys', async () => {
  const { validator, cleanup } = await bundleValidatorForTests();

  try {
    const result = validator.clampNumericTokens({
      contrast: 10,
      fontScale: 0.1,
      spacing: -2,
      radius: 99,
    });

    assert.deepEqual(result.tokens, {
      contrast: 2,
      fontScale: 0.75,
      spacing: 0,
      radius: 24,
    });
    assert.deepEqual(result.clamped, ['contrast', 'fontScale', 'spacing', 'radius']);
  } finally {
    await cleanup();
  }
});

test('validateSafeEnhancementPlan filters unmatched selectors with synthetic DOM fixture', async () => {
  const { validator, cleanup } = await bundleValidatorForTests();

  try {
    const fixture = JSON.parse(
      await readFile('packages/validator/tests/fixtures/selector-dom.json', 'utf8'),
    );

    const selectorExists = validator.createSelectorExistsFromQueryRoot({
      querySelector: (selector) => {
        if (fixture.throwSelectors.includes(selector)) {
          throw new Error('Unsupported selector');
        }

        return fixture.selectors.includes(selector) ? { selector } : null;
      },
    });

    const result = validator.validateSafeEnhancementPlan(
      {
        ...basePlan,
        enhancements: [
          basePlan.enhancements[0],
          {
            id: 'jump-1',
            type: 'jump_links',
            title: 'Jump',
            optional: true,
            links: [
              { id: 'good', label: 'Main', selector: '#content' },
              { id: 'bad', label: 'Unsupported', selector: ':has(.unsupported)' },
            ],
          },
          {
            id: 'style-1',
            type: 'style_patch',
            title: 'Patch',
            patch: {
              rules: [{ selector: '.missing', declarations: { marginTop: '4px' } }],
            },
          },
        ],
      },
      { selectorExists },
    );

    assert.equal(result.ok, false);
    assert(result.warnings.some((issue) => issue.code === 'SELECTOR_NOT_FOUND'));
    assert(result.errors.some((issue) => issue.code === 'ENHANCEMENT_HAS_NO_VALID_TARGETS'));
  } finally {
    await cleanup();
  }
});
