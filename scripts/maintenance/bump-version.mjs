import { readFile, writeFile } from 'node:fs/promises';

const nextVersion = process.argv[2];

if (!nextVersion || !/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  console.error('Usage: node scripts/maintenance/bump-version.mjs <major.minor.patch>');
  process.exit(1);
}

const targets = [
  new URL('../../package.json', import.meta.url),
  new URL('../../apps/extension/package.json', import.meta.url),
  new URL('../../apps/extension/public/manifest.json', import.meta.url),
];

for (const target of targets) {
  const current = JSON.parse(await readFile(target, 'utf8'));
  current.version = nextVersion;
  await writeFile(target, `${JSON.stringify(current, null, 2)}\n`);
  console.info(`[PageAura] Updated ${target.pathname} to version ${nextVersion}`);
}
