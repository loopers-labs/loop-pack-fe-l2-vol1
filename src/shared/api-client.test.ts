import { environmentManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from './api-client';

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

  it('실패 응답은 API가 준 message로 throw한다', async () => {
    server.use(
      http.get(`${APP_ORIGIN}/api/home`, () =>
        HttpResponse.json(
          { message: '홈 데이터를 불러오지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );

    await expect(apiClient('/api/home')).rejects.toThrow(
      '홈 데이터를 불러오지 못했습니다.',
    );
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
