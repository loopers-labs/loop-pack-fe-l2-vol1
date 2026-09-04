// @vitest-environment jsdom

import '@/test/setupDom';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddToCart } from './useAddToCart';

const cart = vi.hoisted(() => ({
  addItem: vi.fn(),
}));
const analytics = vi.hoisted(() => ({
  trackCartAdd: vi.fn(),
}));

vi.mock('@/entities/cart/model/useCartStore', () => ({
  useCartStore: () => cart.addItem,
}));
vi.mock('@/analytics/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/analytics/events')>()),
  ...analytics,
}));

describe('useAddToCart', () => {
  beforeEach(() => {
    cart.addItem.mockReset();
    analytics.trackCartAdd.mockReset();
  });

  it('상품을 장바구니에 담고 같은 상품의 성공 이벤트를 남긴다', () => {
    const { result } = renderHook(() => useAddToCart('p1'));

    result.current();

    expect(cart.addItem).toHaveBeenCalledWith('p1');
    expect(analytics.trackCartAdd).toHaveBeenCalledWith('p1');
    expect(cart.addItem.mock.invocationCallOrder[0]).toBeLessThan(
      analytics.trackCartAdd.mock.invocationCallOrder[0],
    );
  });
});
