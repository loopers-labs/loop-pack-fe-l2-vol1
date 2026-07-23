import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from './api-client';

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

// 서버에는 window가 없다. jsdom 환경에서 서버 분기를 확인하려면 지워야 한다.
const mockServerEnvironment = (appOrigin?: string) => {
  vi.stubGlobal('window', undefined);
  vi.stubEnv('APP_ORIGIN', appOrigin);
};

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
    mockFetch({ ok: true, status: 200, body: {} });

    await apiClient('/api/products?page=2');

    expect(fetch).toHaveBeenCalledWith('/api/products?page=2');
  });

  it('서버에서는 APP_ORIGIN을 붙인 절대 URL로 요청한다', async () => {
    mockServerEnvironment('https://commerce.example');
    mockFetch({ ok: true, status: 200, body: {} });

    await apiClient('/api/products?page=2');

    expect(fetch).toHaveBeenCalledWith(
      'https://commerce.example/api/products?page=2',
    );
  });

  it('서버에서 APP_ORIGIN이 없으면 설정 오류로 throw한다', async () => {
    mockServerEnvironment();
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 URL 형식이 아니면 설정 오류로 throw한다', async () => {
    mockServerEnvironment('commerce.example');
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('서버에서 APP_ORIGIN이 http·https가 아니면 설정 오류로 throw한다', async () => {
    mockServerEnvironment('ftp://commerce.example');
    mockFetch({ ok: true, status: 200, body: {} });

    await expect(apiClient('/api/home')).rejects.toThrow('APP_ORIGIN');
    expect(fetch).not.toHaveBeenCalled();
  });
});
