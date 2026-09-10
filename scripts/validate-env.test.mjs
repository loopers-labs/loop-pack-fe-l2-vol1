import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEnvironment } from './validate-env.mjs';

test('CI accepts its local server but rejects missing, external and malformed origins', () => {
  assert.deepEqual(validateEnvironment({ APP_ORIGIN: 'http://127.0.0.1:3100' }, 'ci'), []);
  for (const APP_ORIGIN of [undefined, '', 'broken', 'ftp://localhost', 'https://example.com',
    'http://user:pass@localhost', 'http://localhost/path', 'http://localhost/?q=1', 'http://localhost/#x']) {
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
});

test('unapproved public variables fail without revealing their values', () => {
  const secret = 'do-not-print-this-value';
  const errors = validateEnvironment({ APP_ORIGIN: 'http://localhost:3100', NEXT_PUBLIC_KEY: secret }, 'ci');
  assert.ok(errors.length > 0);
  assert.equal(errors.join('').includes(secret), false);
});
