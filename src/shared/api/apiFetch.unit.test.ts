import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/mocks/node';
import { ApiError, apiFetch } from './apiFetch';

const PREVIEW_HOST = 'preview-branch.vercel.app';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: PREVIEW_HOST, 'x-forwarded-proto': 'https' }),
  cookies: async () => ({ toString: () => '_vercel_jwt=visitor-token' })
}));

// /api/example은 실재하지 않는 경로다 — 이 테스트는 특정 라우트가 아니라 apiFetch의 계약만 검증
const EXAMPLE_PATH = '*/api/example';

describe('apiFetch', () => {
  it('returns parsed JSON on a 2xx response', async () => {
    server.use(http.get(EXAMPLE_PATH, () => HttpResponse.json({ value: 1 })));

    await expect(apiFetch('/api/example')).resolves.toEqual({ value: 1 });
  });

  it('throws ApiError with the response status and message on a non-2xx response', async () => {
    server.use(http.get(EXAMPLE_PATH, () => HttpResponse.json({ message: '요청 조건을 확인해주세요.' }, { status: 400 })));

    await expect(apiFetch('/api/example')).rejects.toMatchObject({
      status: 400,
      message: '요청 조건을 확인해주세요.'
    });
    await expect(apiFetch('/api/example')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a default message when the error body is not JSON', async () => {
    server.use(http.get(EXAMPLE_PATH, () => new HttpResponse('not json', { status: 500 })));

    await expect(apiFetch('/api/example')).rejects.toMatchObject({
      status: 500,
      message: '요청을 처리하지 못했습니다.'
    });
  });
});

// Preview는 Standard Protection 뒤라, 방문자가 연 URL과 그 URL에만 유효한 쿠키로 호출해야 보호를 통과한다
describe('apiFetch on a Vercel preview server', () => {
  const previewExampleUrl = `https://${PREVIEW_HOST}/api/example`;

  beforeEach(() => {
    vi.stubEnv('VERCEL_ENV', 'preview');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('calls the requested host with the visitor cookie', async () => {
    let receivedCookie: string | null = null;
    server.use(
      http.get(previewExampleUrl, ({ request }) => {
        receivedCookie = request.headers.get('cookie');
        return HttpResponse.json({ value: 1 });
      })
    );

    await expect(apiFetch('/api/example')).resolves.toEqual({ value: 1 });
    expect(receivedCookie).toBe('_vercel_jwt=visitor-token');
  });

  it('fails with ApiError instead of following a protection redirect', async () => {
    server.use(http.get(previewExampleUrl, () => new HttpResponse(null, { status: 302, headers: { location: 'https://vercel.com/sso-api' } })));

    await expect(apiFetch('/api/example')).rejects.toMatchObject({ status: 302 });
  });
});
