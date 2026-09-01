import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CommerceError from '@/app/(commerce)/error';
import { orderQueries } from '@/entities/order';
import { useCheckoutStore } from '@/entities/order/model/checkout-store';
import { productQueries } from '@/entities/product';
import { SessionMenu } from '@/features/auth';
import { ApiError } from '@/shared/api-client';
import { getQueryClient } from '@/shared/get-query-client';
import { SESSION_USER } from '@tests/msw/fixtures';
import { renderWithProviders } from '@tests/render-with-providers';

const { router, currentUrl } = vi.hoisted(() => ({
  router: { replace: vi.fn<(href: string) => void>() },
  currentUrl: new URL('http://localhost/orders?status=pending'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => currentUrl.pathname,
  useSearchParams: () => currentUrl.searchParams,
}));

const replacedUrl = () =>
  new URL(String(router.replace.mock.lastCall?.[0]), 'http://localhost');

afterEach(() => {
  getQueryClient().clear();
  vi.clearAllMocks();
});

describe('세션 만료 처리', () => {
  it('401이면 계정 상태를 정리하고 checkout draft는 유지한 채 로그인으로 보낸다', async () => {
    const queryClient = getQueryClient();
    const userOrderQueryKey = orderQueries.list(SESSION_USER.id).queryKey;

    queryClient.setQueryData(userOrderQueryKey, { orders: [] });
    queryClient.setQueryData(productQueries.all(), 'public-products');
    useCheckoutStore.setState({
      draftItems: [{ productId: 'p1', quantity: 2 }],
    });

    renderWithProviders(
      <>
        <SessionMenu />
        <CommerceError
          error={new ApiError(401, '로그인이 필요합니다.')}
          unstable_retry={() => {}}
        />
      </>,
      { queryClient, initialUser: SESSION_USER },
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      '세션이 만료되어 로그인 화면으로 이동합니다.',
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledTimes(1);
    });
    expect(replacedUrl().pathname).toBe('/login');
    expect(replacedUrl().searchParams.get('reason')).toBe('expired');
    expect(replacedUrl().searchParams.get('next')).toBe(
      '/orders?status=pending',
    );
    expect(queryClient.getQueryData(userOrderQueryKey)).toBeUndefined();
    expect(queryClient.getQueryData(productQueries.all())).toBe(
      'public-products',
    );
    // 재로그인 후 직전 작업을 복원해야 하므로 checkout draft는 만료 정리에서 제외한다
    expect(useCheckoutStore.getState().draftItems).toEqual([
      { productId: 'p1', quantity: 2 },
    ]);
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
  });
});
