import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const bundleSharedSchemasForTests = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pageaura-shared-types-test-'));
  const outfile = join(tempDir, 'schemas.bundle.mjs');

  await build({
    entryPoints: ['packages/shared-types/src/schemas.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    absWorkingDir: process.cwd(),
  });

  const module = await import(pathToFileURL(outfile).href);

  return {
    schemas: module,
    cleanup: async () => rm(tempDir, { recursive: true, force: true }),
  };
};

test('shared schemas expose deterministic top-level object contracts', async () => {
  const { schemas, cleanup } = await bundleSharedSchemasForTests();

  try {
    const schemaMap = {
      pageSnapshotSchema: ['metadata', 'actions', 'sections', 'metrics'],
      enhancementPlanSchema: ['planId', 'snapshotId', 'generatedAt', 'summary', 'enhancements'],
      runtimeExecutionPlanSchema: ['executionId', 'sourcePlanId', 'generatedAt', 'ops'],
      settingsStateSchema: [
        'global',
        'sites',
        'lastSummaryByHost',
        'dismissedEnhancementIdsByHost',
        'lastExecutionByHost',
      ],
      pageAuraMessageSchema: ['type', 'requestId'],
    };

    for (const [name, requiredKeys] of Object.entries(schemaMap)) {
      const schema = schemas[name];
      assert.ok(schema, `${name} must be exported`);
      assert.equal(schema.type, 'object');
      assert.deepEqual(schema.required, requiredKeys);
      assert.equal(new Set(Object.keys(schema.properties)).size, requiredKeys.length);
    }
  } finally {
    await cleanup();
  }
});

test('schema additionalProperties flags stay intentionally strict/loose by contract', async () => {
  const { schemas, cleanup } = await bundleSharedSchemasForTests();

  try {
    assert.equal(schemas.pageSnapshotSchema.additionalProperties, false);
    assert.equal(schemas.enhancementPlanSchema.additionalProperties, false);
    assert.equal(schemas.runtimeExecutionPlanSchema.additionalProperties, false);
    assert.equal(schemas.settingsStateSchema.additionalProperties, false);
    assert.equal(schemas.pageAuraMessageSchema.additionalProperties, true);
  } finally {
    await cleanup();
  }
});
