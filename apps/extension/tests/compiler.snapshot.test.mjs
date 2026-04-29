import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const bundleCompilerForTests = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pageaura-compiler-snapshot-test-'));
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

const plan = {
  planId: 'plan-snapshot',
  snapshotId: 'snapshot-1',
  generatedAt: '2026-04-28T00:00:00.000Z',
  summary: 'compiler snapshot plan',
  enhancements: [
    {
      id: 'toolbar-1',
      type: 'insert_toolbar',
      title: 'Toolbar',
      items: [{ id: 'focus-main', label: ' Focus main ', selector: ' main ', behavior: 'focus' }],
    },
    {
      id: 'jump-1',
      type: 'jump_links',
      title: 'Jump links',
      links: [{ id: 'section-main', label: ' Main ', selector: ' #content ' }],
    },
    {
      id: 'theme-1',
      type: 'theme_patch',
      title: 'Theme',
      patch: { preset: 'dark' },
    },
    {
      id: 'style-1',
      type: 'style_patch',
      title: 'Style',
      patch: {
        rules: [
          {
            selector: ' .card ',
            declarations: {
              fontSize: '16px',
              color: ' red ',
            },
          },
        ],
      },
    },
  ],
};

test('compileRuntimeExecutionPlan output remains stable for deterministic fixture input', async () => {
  const { compileRuntimeExecutionPlan, cleanup } = await bundleCompilerForTests();

  try {
    const snapshot = JSON.parse(
      await readFile('apps/extension/tests/fixtures/compiler-runtime-plan.snapshot.json', 'utf8'),
    );

    const runtimePlan = compileRuntimeExecutionPlan(plan);
    assert.deepEqual(runtimePlan, snapshot);
  } finally {
    await cleanup();
  }
});
