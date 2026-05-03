import { readFile } from 'node:fs/promises';

const rootPackage = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);
const extensionPackage = JSON.parse(
  await readFile(new URL('../../apps/extension/package.json', import.meta.url), 'utf8'),
);
const manifest = JSON.parse(
  await readFile(new URL('../../apps/extension/public/manifest.json', import.meta.url), 'utf8'),
);

const expectedVersion = rootPackage.version;
const errors = [];

if (extensionPackage.version !== expectedVersion) {
  errors.push(
    `apps/extension/package.json version ${extensionPackage.version} does not match root package version ${expectedVersion}.`,
  );
}

if (manifest.version !== expectedVersion) {
  errors.push(
    `apps/extension/public/manifest.json version ${manifest.version} does not match root package version ${expectedVersion}.`,
  );
}

if (errors.length > 0) {
  console.error('[PageAura] Version check failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.info(`[PageAura] Version check passed (${expectedVersion}).`);
