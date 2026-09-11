import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const requireFromNext = createRequire(require.resolve('next/package.json'));
const { loadEnvConfig } = requireFromNext('@next/env');

function isLoopbackHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === 'localhost' || normalized.endsWith('.localhost') ||
    normalized === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    /^\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/.test(normalized);
}

function isLocalOnlyHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return isLoopbackHostname(normalized) || normalized === '0.0.0.0' || normalized === '[::]';
}

export function validateEnvironment(env, mode) {
  const errors = [];
  if (!['local', 'ci', 'preview', 'production'].includes(mode)) errors.push('Explicit environment mode is required');
  let origin;
  try {
    origin = new URL(env.APP_ORIGIN);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
        origin.search || origin.hash || origin.pathname !== '/') throw new Error('Invalid origin');
  } catch {
    errors.push('APP_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment');
  }
  if (mode === 'ci' && origin && !isLoopbackHostname(origin.hostname)) {
    errors.push('CI APP_ORIGIN must point to a loopback test server');
  }
  if (['preview', 'production'].includes(mode)) {
    if (origin?.protocol !== 'https:') errors.push('Deployed APP_ORIGIN must use HTTPS');
    if (origin && isLocalOnlyHostname(origin.hostname)) errors.push('Deployed APP_ORIGIN must not be loopback');
    if (!env.EXPECTED_APP_ORIGIN || env.APP_ORIGIN !== env.EXPECTED_APP_ORIGIN) {
      errors.push('APP_ORIGIN must match the independently configured EXPECTED_APP_ORIGIN');
    }
    if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 43 || env.AUTH_SESSION_SECRET === 'loopers-week09-secret') {
      errors.push('AUTH_SESSION_SECRET must be supplied (32 random bytes, base64url encoded); source fallback is forbidden');
    }
  }
  // This app currently consumes no NEXT_PUBLIC_* variables. An explicit allowlist
  // avoids guessing whether arbitrary names are secrets. Values are never logged.
  if (Object.keys(env).some((name) => name.startsWith('NEXT_PUBLIC_'))) {
    errors.push('Unapproved NEXT_PUBLIC_ variable: public variable allowlist is empty');
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { combinedEnv } = loadEnvConfig(
    process.cwd(),
    false,
    { info() {}, error() {} },
    true,
  );
  const errors = validateEnvironment(combinedEnv, process.argv[2] ?? combinedEnv.VERCEL_ENV);
  for (const error of errors) console.error(error);
  if (!errors.length) console.log('Environment validation passed (values omitted)');
  process.exitCode = errors.length ? 1 : 0;
}
