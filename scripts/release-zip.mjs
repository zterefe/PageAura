import { mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const releaseDir = new URL('../release/', import.meta.url);
const extensionDistDir = new URL('../apps/extension/dist/', import.meta.url);
const zipPath = new URL('../release/pageaura-extension.zip', import.meta.url);

await mkdir(releaseDir, { recursive: true });
await rm(zipPath, { force: true });

await execFileAsync('zip', ['-r', zipPath.pathname, '.'], {
  cwd: extensionDistDir.pathname,
});

console.info(`[PageAura] release artifact generated: ${zipPath.pathname}`);
