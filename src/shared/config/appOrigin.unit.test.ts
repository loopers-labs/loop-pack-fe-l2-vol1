import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAppOrigin } from './appOrigin';

describe('getAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('preview 배포에서는 VERCEL_URL로 파생한다', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'commerce-abc123.vercel.app');

    expect(getAppOrigin()).toBe('https://commerce-abc123.vercel.app');
  });

  it('preview 배포에서는 APP_ORIGIN이 있어도 파생값이 우선한다', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'commerce-abc123.vercel.app');
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');

    expect(getAppOrigin()).toBe('https://commerce-abc123.vercel.app');
  });

  it('production 배포에서는 VERCEL_URL이 있어도 APP_ORIGIN을 쓴다', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_URL', 'commerce-abc123.vercel.app');
    vi.stubEnv('APP_ORIGIN', 'https://commerce.example.com');

    expect(getAppOrigin()).toBe('https://commerce.example.com');
  });

  it('Vercel이 아닌 환경에서는 APP_ORIGIN을 쓴다', () => {
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');

    expect(getAppOrigin()).toBe('http://localhost:3000');
  });

  it('파생도 APP_ORIGIN도 없으면 던진다', () => {
    vi.stubEnv('APP_ORIGIN', '');

    expect(() => getAppOrigin()).toThrow('APP_ORIGIN이 설정되지 않았습니다.');
  });
});
