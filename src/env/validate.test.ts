import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { validateBuildEnv, validateServerEnv } from './validate';

beforeEach(() => {
  for (const name of [
    'APP_ORIGIN',
    'AUTH_SESSION_SECRET',
    'NEXT_PUBLIC_AUTH_SESSION_SECRET',
    'NEXT_PUBLIC_VERCEL_TOKEN',
    'VERCEL_ENV',
    'VERCEL_URL',
    'VERCEL_BRANCH_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
    'GITHUB_STEP_SUMMARY',
  ])
    vi.stubEnv(name, undefined);
});
afterEach(() => vi.unstubAllEnvs());

function setEnv(env: Record<string, string>) {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
}

const VALID_LOCAL = {
  APP_ORIGIN: 'http://localhost:3000',
  AUTH_SESSION_SECRET: 'test-secret',
};

const VALID_PRODUCTION = {
  VERCEL_ENV: 'production',
  APP_ORIGIN: 'https://commerce.example',
  VERCEL_PROJECT_PRODUCTION_URL: 'commerce.example',
  AUTH_SESSION_SECRET: 'test-secret',
};

it.each<[string, Record<string, string>]>([
  [
    '로컬·CI — 데모 시크릿과 정상 공개 변수 허용',
    {
      ...VALID_LOCAL,
      AUTH_SESSION_SECRET: 'loopers-week09-secret',
      NEXT_PUBLIC_FEATURE_FLAG: 'on',
    },
  ],
  ['Production', VALID_PRODUCTION],
  [
    'Preview — origin 설정은 선택',
    { VERCEL_ENV: 'preview', AUTH_SESSION_SECRET: 'test-secret' },
  ],
  [
    'Preview — 자기 배포 주소 origin',
    {
      VERCEL_ENV: 'preview',
      APP_ORIGIN: 'https://pr-1.commerce.vercel.app',
      VERCEL_URL: 'pr-1.commerce.vercel.app',
      AUTH_SESSION_SECRET: 'test-secret',
    },
  ],
])('%s의 정상 설정이면 성공한다', (_, env) => {
  setEnv(env);
  expect(() => validateServerEnv()).not.toThrow();
});

it.each<[string, Record<string, string>, string]>([
  ['origin 누락', { AUTH_SESSION_SECRET: 'test-secret' }, 'APP_ORIGIN'],
  ['origin 공백', { ...VALID_LOCAL, APP_ORIGIN: '   ' }, 'APP_ORIGIN'],
  [
    'origin이 URL 형식이 아님',
    { ...VALID_LOCAL, APP_ORIGIN: 'commerce.example' },
    'APP_ORIGIN',
  ],
  [
    'http·https 외 URL',
    { ...VALID_LOCAL, APP_ORIGIN: 'ftp://commerce.example' },
    'APP_ORIGIN',
  ],
  [
    '시크릿 누락',
    { APP_ORIGIN: VALID_LOCAL.APP_ORIGIN },
    'AUTH_SESSION_SECRET',
  ],
  [
    '시크릿 공백',
    { ...VALID_LOCAL, AUTH_SESSION_SECRET: '   ' },
    'AUTH_SESSION_SECRET',
  ],
  [
    '비밀 변수 공개 접두 — 빈 값도 금지',
    { ...VALID_LOCAL, NEXT_PUBLIC_AUTH_SESSION_SECRET: '' },
    'NEXT_PUBLIC_AUTH_SESSION_SECRET',
  ],
  [
    'Production origin 누락',
    { VERCEL_ENV: 'production', AUTH_SESSION_SECRET: 'test-secret' },
    'APP_ORIGIN',
  ],
  [
    'Preview origin 형식 오류',
    {
      VERCEL_ENV: 'preview',
      APP_ORIGIN: 'not-a-url',
      AUTH_SESSION_SECRET: 'test-secret',
    },
    'APP_ORIGIN',
  ],
  [
    '배포 데모 시크릿',
    { ...VALID_PRODUCTION, AUTH_SESSION_SECRET: 'loopers-week09-secret' },
    'AUTH_SESSION_SECRET',
  ],
  [
    '배포 시크릿이 [SENSITIVE] 자리표시자',
    { ...VALID_PRODUCTION, AUTH_SESSION_SECRET: '[SENSITIVE]' },
    'AUTH_SESSION_SECRET',
  ],
  [
    'Production origin이 배포 주소와 다름',
    { ...VALID_PRODUCTION, APP_ORIGIN: 'https://other.example' },
    'APP_ORIGIN',
  ],
  // 값이 비노출 단언에 걸리도록 비URL 값을 시크릿 문자열로 준다.
  [
    '배포 origin이 URL 형식이 아님 — 값 비노출',
    { ...VALID_PRODUCTION, APP_ORIGIN: 'test-secret' },
    'APP_ORIGIN',
  ],
  [
    'Production 허용 주소 정보가 없어 대조 불가',
    {
      VERCEL_ENV: 'production',
      APP_ORIGIN: 'https://commerce.example',
      AUTH_SESSION_SECRET: 'test-secret',
    },
    'APP_ORIGIN',
  ],
  [
    'Preview origin이 자기 배포 주소와 다름',
    {
      VERCEL_ENV: 'preview',
      APP_ORIGIN: 'https://commerce.example',
      VERCEL_URL: 'pr-1.commerce.vercel.app',
      AUTH_SESSION_SECRET: 'test-secret',
    },
    'APP_ORIGIN',
  ],
])('%s이면 실패하고 변수명만 출력한다', (_, env, field) => {
  setEnv(env);
  expect(() => validateServerEnv()).toThrow(field);
  expect(() => validateServerEnv()).not.toThrow(
    /test-secret|loopers-week09-secret/,
  );
});

it.each([
  ['로컬', { APP_ORIGIN: VALID_LOCAL.APP_ORIGIN }],
  [
    'Production',
    {
      VERCEL_ENV: 'production',
      APP_ORIGIN: VALID_PRODUCTION.APP_ORIGIN,
      VERCEL_PROJECT_PRODUCTION_URL:
        VALID_PRODUCTION.VERCEL_PROJECT_PRODUCTION_URL,
    },
  ],
] satisfies [string, Record<string, string>][])(
  '%s 빌드 검증은 런타임 시크릿 없이 통과한다',
  (_, env) => {
    setEnv(env);
    expect(() => validateBuildEnv()).not.toThrow();
  },
);

it('빌드 검증도 잘못된 origin과 비밀 공개 변수를 거부한다', () => {
  setEnv({
    APP_ORIGIN: 'ftp://commerce.example',
    NEXT_PUBLIC_AUTH_SESSION_SECRET: 'must-not-leak',
  });
  expect(() => validateBuildEnv()).toThrow('APP_ORIGIN');
  expect(() => validateBuildEnv()).toThrow('NEXT_PUBLIC_AUTH_SESSION_SECRET');
  expect(() => validateBuildEnv()).not.toThrow('must-not-leak');
});

it('호출할 때 변경된 서버 env를 다시 검증한다', () => {
  setEnv(VALID_LOCAL);
  expect(() => validateServerEnv()).not.toThrow();
  vi.stubEnv('AUTH_SESSION_SECRET', '   ');
  expect(() => validateServerEnv()).toThrow('AUTH_SESSION_SECRET: 공백');
});

it('검증을 반복해도 PASS를 기록하지 않고 이후 오류는 즉시 summary에 남긴다', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'env-summary-'));
  const summary = join(cwd, 'summary.md');
  writeFileSync(summary, '');
  setEnv({ ...VALID_LOCAL, GITHUB_STEP_SUMMARY: summary });
  try {
    validateBuildEnv();
    validateBuildEnv();
    validateBuildEnv();
    expect(readFileSync(summary, 'utf8')).toBe('');
    vi.stubEnv('APP_ORIGIN', 'secret-invalid-origin');
    expect(() => validateBuildEnv()).toThrow('APP_ORIGIN');
    expect(readFileSync(summary, 'utf8')).toContain(
      'env 검증: FAIL (build/local)',
    );
    expect(readFileSync(summary, 'utf8')).not.toContain(
      'secret-invalid-origin',
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
