// @vitest-environment jsdom

import '@/test/setupDom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartStoreProvider } from '@/entities/cart/model/CartStoreProvider';
import { orderKeys } from '@/entities/order/api/orderQueries';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { HeaderNav } from './HeaderNav';

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  logout: vi.fn(),
}));
const analytics = vi.hoisted(() => ({
  resetAnalyticsUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('@/entities/auth/api/authService', () => auth);
vi.mock('@/analytics/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/analytics/events')>()),
  ...analytics,
}));

describe('HeaderNav 로그아웃', () => {
  beforeEach(() => {
    localStorage.clear();
    router.replace.mockReset();
    router.refresh.mockReset();
    auth.logout.mockReset();
    auth.logout.mockResolvedValue(undefined);
    analytics.resetAnalyticsUser.mockReset();
    useWishlistStore.setState({ ids: new Set(['p1']), isHydrated: true });
  });

  it('회원 주문 캐시를 제거하고 위시리스트는 유지한 채 비로그인 화면을 다시 요청한다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(orderKeys.list(), {
      orders: [{ id: 'o1', createdAt: '2026-09-02', items: [] }],
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CartStoreProvider ownerKey="user:u1">
          <HeaderNav
            user={{
              id: 'u1',
              name: '루퍼1',
              email: 'looper1@loopers.dev',
            }}
          />
        </CartStoreProvider>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(auth.logout).toHaveBeenCalledOnce();
    expect(analytics.resetAnalyticsUser).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(queryClient.getQueryData(orderKeys.list())).toBeUndefined();
    });
    expect(useWishlistStore.getState().ids).toEqual(new Set(['p1']));
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.refresh).toHaveBeenCalledOnce();
  });
});
