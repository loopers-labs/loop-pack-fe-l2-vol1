import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './validate-env.mjs';

const validatorPath = fileURLToPath(new URL('./validate-env.mjs', import.meta.url));

test('CI accepts its local server but rejects missing, external and malformed origins', () => {
  assert.deepEqual(validateEnvironment({ APP_ORIGIN: 'http://127.0.0.1:3100' }, 'ci'), []);
  assert.deepEqual(validateEnvironment({ APP_ORIGIN: 'http://localhost.:3100' }, 'ci'), []);
  for (const APP_ORIGIN of [undefined, '', 'broken', 'ftp://localhost', 'https://example.com',
    'http://0.0.0.0:3100', 'http://[::]:3100', 'http://user:pass@localhost',
    'http://localhost/path', 'http://localhost/?q=1', 'http://localhost/#x']) {
    assert.ok(validateEnvironment({ APP_ORIGIN }, 'ci').length > 0);
  }
});

test('deployments require explicit target and a non-default signing secret', () => {
  const env = { APP_ORIGIN: 'https://preview.example.com', EXPECTED_APP_ORIGIN: 'https://preview.example.com', AUTH_SESSION_SECRET: 'x'.repeat(43) };
  assert.deepEqual(validateEnvironment(env, 'preview'), []);
  for (const changed of [{ EXPECTED_APP_ORIGIN: undefined }, { APP_ORIGIN: 'https://production.example.com' },
    { AUTH_SESSION_SECRET: undefined }, { AUTH_SESSION_SECRET: 'loopers-week09-secret' }]) {
    assert.ok(validateEnvironment({ ...env, ...changed }, 'preview').length > 0);
  }
  assert.ok(validateEnvironment(env, undefined).length > 0);
  for (const APP_ORIGIN of ['https://localhost.', 'https://app.localhost', 'https://127.1',
    'https://[::1]', 'https://[::ffff:127.0.0.1]', 'https://0.0.0.0', 'https://[::]']) {
    assert.ok(validateEnvironment({ ...env, APP_ORIGIN, EXPECTED_APP_ORIGIN: APP_ORIGIN }, 'preview').length > 0);
  }
});

test('unapproved public variables fail without revealing their values', () => {
  const secret = 'do-not-print-this-value';
  const errors = validateEnvironment({ APP_ORIGIN: 'http://localhost:3100', NEXT_PUBLIC_KEY: secret }, 'ci');
  assert.ok(errors.length > 0);
  assert.equal(errors.join('').includes(secret), false);
});

test('Vercel deployment metadata is allowed only in the reserved system namespace', () => {
  const origin = 'https://preview.example.com';
  const env = {
    APP_ORIGIN: origin,
    AUTH_SESSION_SECRET: 'x'.repeat(43),
    EXPECTED_APP_ORIGIN: origin,
    NEXT_PUBLIC_VERCEL_URL: 'generated-preview.vercel.app',
    VERCEL: '1',
  };

  assert.deepEqual(validateEnvironment(env, 'preview'), []);
  assert.ok(validateEnvironment({ ...env, VERCEL: undefined }, 'preview').length > 0);
  assert.ok(validateEnvironment({ ...env, NEXT_PUBLIC_CUSTOM_KEY: 'public' }, 'preview').length > 0);
});

test('CLI validates variables loaded by Next from production environment files', () => {
  const fixtureDirectory = mkdtempSync(join(tmpdir(), 'loopers-env-'));
  const secret = 'must-not-appear-in-output';
  try {
    writeFileSync(
      join(fixtureDirectory, '.env.production'),
      `NEXT_PUBLIC_API_SECRET=${secret}\n`,
      'utf8',
    );
    const result = spawnSync(process.execPath, [validatorPath, 'ci'], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
      env: { APP_ORIGIN: 'http://127.0.0.1:3100' },
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unapproved NEXT_PUBLIC_ variable/);
    assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
  } finally {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  }
});

test('CLI uses the Vercel deployment environment when no mode argument is supplied', () => {
  const origin = 'https://preview.example.com';
  const result = spawnSync(process.execPath, [validatorPath], {
    encoding: 'utf8',
    env: {
      APP_ORIGIN: origin,
      AUTH_SESSION_SECRET: 'x'.repeat(43),
      EXPECTED_APP_ORIGIN: origin,
      VERCEL_ENV: 'preview',
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Environment validation passed/);
});
