import { environmentManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiClient } from './api-client';

import { server } from '@tests/msw/server';

const APP_ORIGIN = 'https://commerce.example';

const mockHome = () => {
  const handler = vi.fn(() => HttpResponse.json({}));

  server.use(http.get(`${APP_ORIGIN}/api/home`, handler));

  return handler;
};

beforeEach(() => {
  environmentManager.setIsServer(() => true);
  vi.stubEnv('APP_ORIGIN', APP_ORIGIN);
});

describe('apiClient', () => {
  it('성공 응답은 파싱한 json을 반환한다', async () => {
    server.use(
      http.get(`${APP_ORIGIN}/api/home`, () =>
        HttpResponse.json({ hello: 'world' }),
      ),
    );

    await expect(apiClient('/api/home')).resolves.toEqual({ hello: 'world' });
  });

  it('실패 응답은 HTTP 상태와 API message를 가진 ApiError로 throw한다', async () => {
    server.use(
      http.get(`${APP_ORIGIN}/api/orders`, () =>
        HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
      ),
    );

    const request = apiClient('/api/orders');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 401,
      message: '로그인이 필요합니다.',
    });
  });

  it('에러 본문에 message가 없으면 HTTP 상태로 대신한다', async () => {
    server.use(
      http.get(
        `${APP_ORIGIN}/api/home`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );

    await expect(apiClient('/api/home')).rejects.toThrow('HTTP 503');
  });

  it('네트워크가 끊기면 fetch 오류 대신 사용자용 문구로 바꾼다', async () => {
    server.use(http.get(`${APP_ORIGIN}/api/home`, () => HttpResponse.error()));

    await expect(apiClient('/api/home')).rejects.toThrow(
      '네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('성공 응답이 JSON이 아니면 파싱 오류 대신 사용자용 문구로 바꾼다', async () => {
    server.use(
      http.get(
        `${APP_ORIGIN}/api/home`,
        () => new HttpResponse('not json', { status: 200 }),
      ),
    );

    await expect(apiClient('/api/home')).rejects.toThrow(
      '응답을 처리하지 못했습니다.',
    );
  });

  it('204 응답은 본문을 파싱하지 않고 undefined를 반환한다', async () => {
    server.use(
      http.post(
        `${APP_ORIGIN}/api/auth/logout`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(
      apiClient('/api/auth/logout', { method: 'POST' }),
    ).resolves.toBeUndefined();
  });

  it('init을 fetch에 그대로 넘겨 method·headers·body로 요청한다', async () => {
    let received:
      { method: string; contentType: string | null; body: unknown } | undefined;

    server.use(
      http.post(`${APP_ORIGIN}/api/auth/login`, async ({ request }) => {
        received = {
          method: request.method,
          contentType: request.headers.get('content-type'),
          body: await request.json(),
        };

        return HttpResponse.json({});
      }),
    );

    await apiClient('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'looper1@loopers.dev' }),
    });

    expect(received).toEqual({
      method: 'POST',
      contentType: 'application/json',
      body: { email: 'looper1@loopers.dev' },
    });
  });

  it('서버에서는 APP_ORIGIN을 붙인 절대 URL로 요청한다', async () => {
    let requestedUrl: string | undefined;

    server.use(
      http.get(`${APP_ORIGIN}/api/products`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json({});
      }),
    );

    await apiClient('/api/products?page=2');

    expect(requestedUrl).toBe(`${APP_ORIGIN}/api/products?page=2`);
  });

  it('서버에서 APP_ORIGIN이 없으면 요청하지 않고 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', undefined);
    const home = mockHome();

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(home).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 URL 형식이 아니면 요청하지 않고 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', 'commerce.example');
    const home = mockHome();

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(home).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 http·https가 아니면 요청하지 않고 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', 'ftp://commerce.example');
    const home = mockHome();

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(home).not.toHaveBeenCalled();
  });
});
