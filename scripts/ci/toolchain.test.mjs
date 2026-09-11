import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const NODE_VERSION = '24.17.0';
const PNPM_VERSION = '10.15.1';
const repositoryFile = (path) => new URL(`../../${path}`, import.meta.url);

test('local metadata and CI use one exact Node and pnpm toolchain', async () => {
  const [packageSource, nvmrc, npmrc, workflow] = await Promise.all([
    readFile(repositoryFile('package.json'), 'utf8'),
    readFile(repositoryFile('.nvmrc'), 'utf8'),
    readFile(repositoryFile('.npmrc'), 'utf8'),
    readFile(repositoryFile('.github/workflows/quality.yml'), 'utf8'),
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.equal(nvmrc.trim(), NODE_VERSION);
  assert.equal(packageJson.engines?.node, NODE_VERSION);
  assert.equal(packageJson.packageManager, `pnpm@${PNPM_VERSION}`);
  assert.match(npmrc, /^engine-strict=true\s*$/m);
  assert.match(workflow, /^\s*node-version-file:\s*\.nvmrc\s*$/m);
  const escapedPnpmVersion = PNPM_VERSION.split('.').join('\\.');
  assert.match(workflow, new RegExp(`^\\s*version:\\s*${escapedPnpmVersion}\\s*$`, 'm'));
});
