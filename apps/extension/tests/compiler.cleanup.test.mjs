import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const bundleCompilerForTests = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pageaura-compiler-test-'));
  const outfile = join(tempDir, 'compiler.bundle.mjs');

  await build({
    entryPoints: ['apps/extension/src/content/compiler.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    absWorkingDir: process.cwd(),
  });

  const bundledModule = await import(pathToFileURL(outfile).href);

  return {
    compileRuntimeExecutionPlan: bundledModule.compileRuntimeExecutionPlan,
    cleanup: async () => rm(tempDir, { recursive: true, force: true }),
  };
};

const basePlan = {
  planId: 'plan-1',
  snapshotId: 'snapshot-1',
  generatedAt: '2026-04-28T00:00:00.000Z',
  summary: 'cleanup-sensitive plan',
  enhancements: [
    {
      id: 'toolbar-1',
      type: 'insert_toolbar',
      title: 'Insert toolbar',
      items: [
        {
          id: 'focus-main',
          label: 'Focus main content',
          selector: 'main',
          behavior: 'focus',
        },
      ],
    },
    {
      id: 'theme-1',
      type: 'theme_patch',
      title: 'Apply dark theme',
      patch: {
        preset: 'dark',
      },
    },
  ],
};

test('compileRuntimeExecutionPlan applies replace lifecycle for SPA reruns', async () => {
  const { compileRuntimeExecutionPlan, cleanup } = await bundleCompilerForTests();

  try {
    const runtimePlan = compileRuntimeExecutionPlan(basePlan);

    assert.equal(runtimePlan.lifecycle.strategy, 'replace_existing');
    assert.equal(runtimePlan.lifecycle.cleanupBeforeReapply, true);
    assert.equal(runtimePlan.lifecycle.supportsSpaNavigation, true);
  } finally {
    await cleanup();
  }
});

test('compileRuntimeExecutionPlan batches overlay ops ahead of patch ops', async () => {
  const { compileRuntimeExecutionPlan, cleanup } = await bundleCompilerForTests();

  try {
    const runtimePlan = compileRuntimeExecutionPlan(basePlan);

    assert.deepEqual(
      runtimePlan.batches.map((batch) => batch.batchId),
      ['overlay-ui-batch', 'patch-batch'],
    );

    assert.deepEqual(runtimePlan.batches[0]?.opIds, [
      'mount-overlay-root',
      'enhancement-1-toolbar-1',
    ]);
    assert.deepEqual(runtimePlan.batches[1]?.opIds, ['enhancement-2-theme-1']);
  } finally {
    await cleanup();
  }
});

test('compileRuntimeExecutionPlan emits cleanup registration contracts', async () => {
  const { compileRuntimeExecutionPlan, cleanup } = await bundleCompilerForTests();

  try {
    const runtimePlan = compileRuntimeExecutionPlan(basePlan);

    const toolbarOp = runtimePlan.ops.find((op) => op.opId === 'enhancement-1-toolbar-1');
    assert.ok(toolbarOp);
    assert.deepEqual(toolbarOp.cleanup, [
      {
        cleanupId: 'enhancement-1-toolbar-1:ui-nodes',
        target: 'nodes',
        trigger: 'before_rerun',
      },
      {
        cleanupId: 'enhancement-1-toolbar-1:ui-listeners',
        target: 'listeners',
        trigger: 'on_dispose',
      },
    ]);
  } finally {
    await cleanup();
  }
});
