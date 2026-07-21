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

afterEach(() => {
  vi.unstubAllGlobals();
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
});
