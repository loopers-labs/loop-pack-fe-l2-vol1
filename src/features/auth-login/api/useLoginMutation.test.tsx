import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../test/msw/server';
import { registerProviders, resetAnalyticsForTest, initAnalytics } from '@/analytics/logger';
import { resetAnalyticsSetupForTest, setupAnalytics } from '@/analytics/setup';
import type { AnalyticsProvider, EventProperties } from '@/analytics/provider';

vi.mock('next/navigation', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

const { useLoginMutation } = await import('./useLoginMutation');

/**
 * 로그인 실패 사유가 실패의 종류를 따라가는지 본다.
 *
 * 화면 문구는 세 경우 모두 같지만, 로그까지 하나로 뭉치면 서버가 죽어서 실패한 것과
 * 비밀번호를 틀린 것을 나중에 나눌 수 없다.
 */

const tracked: { event: string; properties: EventProperties }[] = [];

const captureProvider: AnalyticsProvider = {
  name: 'capture',
  initialize() {},
  track(event, properties) {
    tracked.push({ event, properties });
  },
  identify() {},
  reset() {},
};

function renderLoginMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLoginMutation('/orders'), { wrapper });
  return result;
}

/** 마지막으로 남은 login_fail의 사유 */
async function loginFailReason(): Promise<unknown> {
  const result = renderLoginMutation();
  result.current.mutate({ email: 'looper1@loopers.dev', password: 'x' });
  await waitFor(() => expect(result.current.isError).toBe(true));
  return tracked.find((row) => row.event === 'login_fail')?.properties.reason;
}

beforeEach(async () => {
  tracked.length = 0;
  resetAnalyticsForTest();
  resetAnalyticsSetupForTest();
  window.sessionStorage.clear();
  setupAnalytics({ readUserId: () => null });
  registerProviders([captureProvider]);
  await initAnalytics();
});

describe('login_fail의 사유', () => {
  it('자격 증명이 맞지 않으면 INVALID_CREDENTIALS로 남는다', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({ message: '이메일 또는 비밀번호를 확인해 주세요.' }, { status: 401 }),
      ),
    );

    await expect(loginFailReason()).resolves.toBe('INVALID_CREDENTIALS');
  });

  it('서버가 다른 이유로 실패하면 SERVER_ERROR로 남는다', async () => {
    server.use(http.post('*/api/auth/login', () => new HttpResponse(null, { status: 500 })));

    await expect(loginFailReason()).resolves.toBe('SERVER_ERROR');
  });

  // 응답 자체를 받지 못한 경우다. 서버 오류로 적으면 없는 장애를 찾게 된다
  it('요청을 보내지 못하면 NETWORK_ERROR로 남는다', async () => {
    server.use(http.post('*/api/auth/login', () => HttpResponse.error()));

    await expect(loginFailReason()).resolves.toBe('NETWORK_ERROR');
  });

  // 응답은 받았다. 이걸 네트워크 실패로 적으면 "응답을 받지 못한 경우"라는 정의와 어긋난다
  it('성공 응답의 본문을 읽지 못하면 UNKNOWN_ERROR로 남는다', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.text('{"user":', { headers: { 'Content-Type': 'application/json' } }),
      ),
    );

    await expect(loginFailReason()).resolves.toBe('UNKNOWN_ERROR');
  });
});
