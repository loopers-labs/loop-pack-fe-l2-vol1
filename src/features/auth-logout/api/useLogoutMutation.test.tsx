import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../test/msw/server';
import { SESSION_QUERY_KEY } from '@/entities/session/api/sessionQueryOptions';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import type { AuthUser } from '@/entities/session/model/session';

const { replaceRoute, refreshRoute, syncAnalyticsUser } = vi.hoisted(() => ({
  replaceRoute: vi.fn(),
  refreshRoute: vi.fn(),
  syncAnalyticsUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  default: {},
  useRouter: () => ({ replace: replaceRoute, refresh: refreshRoute }),
}));

vi.mock('@/analytics/trackEvents', () => ({ syncAnalyticsUser }));

const { useLogoutMutation } = await import('./useLogoutMutation');

/**
 * 로그아웃이 서버 응답을 확인하는지 본다.
 *
 * 응답을 보지 않으면 서버에는 세션이 남았는데 화면만 로그아웃된 것처럼 보인다. 그 상태에서
 * 담은 목록까지 비우면 사용자는 되돌릴 방법이 없다.
 */

const LOGGED_IN_USER: AuthUser = { id: 'u1', name: '루퍼1', email: 'looper1@loopers.dev' };

function renderLogoutMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(SESSION_QUERY_KEY, LOGGED_IN_USER);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLogoutMutation(), { wrapper });
  return { result, queryClient };
}

beforeEach(() => {
  replaceRoute.mockClear();
  refreshRoute.mockClear();
  syncAnalyticsUser.mockClear();
  useCartStore.setState({ productIds: new Set(['p1']) });
  useWishlistStore.setState({ productIds: new Set(['p2']) });
});

describe('로그아웃 응답 처리', () => {
  it('성공하면 세션과 담은 목록을 비우고 홈으로 보낸다', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    const { result, queryClient } = renderLogoutMutation();

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    expect(useCartStore.getState().productIds.size).toBe(0);
    expect(useWishlistStore.getState().productIds.size).toBe(0);
    expect(syncAnalyticsUser).toHaveBeenCalledTimes(1);
    expect(replaceRoute).toHaveBeenCalledWith('/');
  });

  it('서버가 실패로 답하면 아무것도 바꾸지 않는다', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 })));
    const { result, queryClient } = renderLogoutMutation();

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toEqual(LOGGED_IN_USER);
    expect(useCartStore.getState().productIds.has('p1')).toBe(true);
    expect(useWishlistStore.getState().productIds.has('p2')).toBe(true);
    expect(syncAnalyticsUser).not.toHaveBeenCalled();
    expect(replaceRoute).not.toHaveBeenCalled();
  });
});
