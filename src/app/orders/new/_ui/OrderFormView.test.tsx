import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initAnalytics, registerProviders, resetAnalyticsForTest } from '@/analytics/logger';
import { resetCurrentUserForTest } from '@/analytics/currentUser';
import { resetAnalyticsSetupForTest, setupAnalytics } from '@/analytics/setup';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import type { AnalyticsProvider, EventProperties } from '@/analytics/provider';

vi.mock('next/navigation', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

const { OrderFormView } = await import('./OrderFormView');

/**
 * `order_start`가 저장된 장바구니를 기다리는지 본다.
 *
 * 담은 목록은 sessionStorage에 있어 hydration 이후에 되살아난다. 마운트하자마자 기록하면
 * 새로고침한 주문서가 빈 목록으로 남고, 그 로그만 보면 아무것도 담지 않고 주문서에 들어온
 * 것처럼 보인다.
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

function renderOrderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<OrderFormView />, { wrapper });
}

const orderStartEvents = () => tracked.filter((row) => row.event === 'order_start');

beforeEach(async () => {
  tracked.length = 0;
  resetAnalyticsForTest();
  resetAnalyticsSetupForTest();
  resetCurrentUserForTest();
  window.sessionStorage.clear();
  useCartStore.setState({ productIds: new Set() });
  useCartStore.persist.clearStorage();
  setupAnalytics({ readUserId: () => null });
  registerProviders([captureProvider]);
  await initAnalytics();
});

describe('order_start와 장바구니 복원', () => {
  it('복원이 끝나기 전에는 기록하지 않는다', () => {
    renderOrderForm();

    expect(orderStartEvents()).toEqual([]);
  });

  it('복원이 끝나면 되살아난 목록으로 한 번 기록한다', async () => {
    window.sessionStorage.setItem(
      'CART_STORE',
      JSON.stringify({
        state: { productIds: { __type: 'Set', values: ['p1', 'p2'] } },
        version: 1,
      }),
    );
    renderOrderForm();

    await act(async () => {
      await useCartStore.persist.rehydrate();
    });

    expect(orderStartEvents()).toEqual([
      {
        event: 'order_start',
        properties: expect.objectContaining({ productIds: ['p1', 'p2'], itemCount: 2 }),
      },
    ]);
  });

  it('저장된 목록이 없으면 복원이 끝난 뒤 빈 목록으로 기록한다', async () => {
    renderOrderForm();

    await act(async () => {
      await useCartStore.persist.rehydrate();
    });

    expect(orderStartEvents()).toEqual([
      {
        event: 'order_start',
        properties: expect.objectContaining({ productIds: [], itemCount: 0 }),
      },
    ]);
  });
});
