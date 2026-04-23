import { cp, mkdir } from 'node:fs/promises';
import { build, context } from 'esbuild';

const isWatchMode = process.argv.includes('--watch');

const distUrl = new URL('../dist/', import.meta.url);
const publicUrl = new URL('../public/', import.meta.url);

async function copyStaticAssets() {
  await mkdir(distUrl, { recursive: true });
  await cp(publicUrl, distUrl, { recursive: true, force: true });
}

const commonBuildOptions = {
  bundle: true,
  target: 'chrome114',
  sourcemap: true,
  logLevel: 'info',
};

const backgroundOptions = {
  ...commonBuildOptions,
  entryPoints: ['src/background/serviceWorker.ts'],
  outfile: 'dist/background/serviceWorker.js',
  platform: 'browser',
  format: 'esm',
};

const contentOptions = {
  ...commonBuildOptions,
  entryPoints: ['src/content/index.ts'],
  outfile: 'dist/content/index.js',
  platform: 'browser',
  format: 'iife',
};

await copyStaticAssets();

if (!isWatchMode) {
  await Promise.all([build(backgroundOptions), build(contentOptions)]);
  process.exit(0);
}

const backgroundContext = await context(backgroundOptions);
const contentContext = await context(contentOptions);

await Promise.all([backgroundContext.watch(), contentContext.watch()]);

console.info('[PageAura] extension build watching for changes...');
