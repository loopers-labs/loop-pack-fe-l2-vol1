import { environmentManager } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from './api-client';

const APP_ORIGIN = 'https://commerce.example';

const mockFetch = (response: {
  ok: boolean;
  status: number;
  body: unknown;
}) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status,
      json: () => Promise.resolve(response.body),
    }),
  );
};

const mockUnparsableFetch = (response: { ok: boolean; status: number }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status,
      json: () =>
        Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    }),
  );
};

/**
 * 서버인지 브라우저인지는 apiClient가 실제로 묻는 곳(environmentManager)에 직접 넣는다.
 * 전역 window를 지워 서버인 척하면 판정 로직까지 흉내내는 셈이라, 실제 판정이 바뀌어도 통과한다.
 */
beforeEach(() => {
  environmentManager.setIsServer(() => true);
  vi.stubEnv('APP_ORIGIN', APP_ORIGIN);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('apiClient', () => {
  it('성공 응답은 파싱한 json을 반환한다', async () => {
    mockFetch({ ok: true, status: 200, body: { hello: 'world' } });

    await expect(apiClient('/api/home')).resolves.toEqual({ hello: 'world' });
  });

  it('실패 응답은 API가 준 message로 throw한다', async () => {
    mockFetch({
      ok: false,
      status: 500,
      body: { message: '홈 데이터를 불러오지 못했습니다.' },
    });

    await expect(apiClient('/api/home')).rejects.toThrow(
      '홈 데이터를 불러오지 못했습니다.',
    );
  });

  it('에러 본문에 message가 없으면 HTTP 상태로 대신한다', async () => {
    mockFetch({ ok: false, status: 503, body: null });

    await expect(apiClient('/api/home')).rejects.toThrow('HTTP 503');
  });

  it('네트워크가 끊기면 fetch 오류 대신 사용자용 문구로 바꾼다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(apiClient('/api/home')).rejects.toThrow(
      '네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('성공 응답이 JSON이 아니면 파싱 오류 대신 사용자용 문구로 바꾼다', async () => {
    mockUnparsableFetch({ ok: true, status: 200 });

    await expect(apiClient('/api/home')).rejects.toThrow(
      '응답을 처리하지 못했습니다.',
    );
  });

  it('브라우저에서는 상대 경로 그대로 요청한다', async () => {
    environmentManager.setIsServer(() => false);
    mockFetch({ ok: true, status: 200, body: {} });

    await apiClient('/api/products?page=2');

    expect(fetch).toHaveBeenCalledWith('/api/products?page=2');
  });

  it('서버에서는 APP_ORIGIN을 붙인 절대 URL로 요청한다', async () => {
    mockFetch({ ok: true, status: 200, body: {} });

    await apiClient('/api/products?page=2');

    expect(fetch).toHaveBeenCalledWith(`${APP_ORIGIN}/api/products?page=2`);
  });

  it('서버에서 APP_ORIGIN이 없으면 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', undefined);
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 URL 형식이 아니면 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', 'commerce.example');
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 http·https가 아니면 설정 오류로 throw한다', async () => {
    vi.stubEnv('APP_ORIGIN', 'ftp://commerce.example');
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });
});
