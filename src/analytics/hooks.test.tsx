import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initAnalytics, registerProviders, resetAnalyticsForTest } from './logger';
import { resetAnalyticsSetupForTest, setupAnalytics } from './setup';
import { useScreenViewOnce } from './useScreenViewOnce';
import { useToggleCart } from '@/features/add-to-cart/model/useToggleCart';
import { useToggleWishlist } from '@/features/toggle-wishlist/model/useToggleWishlist';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import type { AnalyticsProvider, EventProperties } from './provider';

/**
 * 발생 단위를 고정한다.
 *
 * - 화면 진입은 처음 표시될 때 한 번 (A-6)
 * - 담기·찜은 담긴 상태로 바뀔 때만 (A-8)
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

beforeEach(async () => {
  tracked.length = 0;
  resetAnalyticsForTest();
  resetAnalyticsSetupForTest();
  window.sessionStorage.clear();
  useCartStore.setState({ productIds: new Set() });
  useWishlistStore.setState({ productIds: new Set() });
  setupAnalytics({ readUserId: () => null });
  registerProviders([captureProvider]);
  await initAnalytics();
});

describe('useScreenViewOnce', () => {
  it('처음 표시될 때 한 번만 보낸다', () => {
    const send = vi.fn();

    renderHook(() => useScreenViewOnce(send));

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('리렌더링에는 다시 보내지 않는다', () => {
    const send = vi.fn();
    const { rerender } = renderHook(() => useScreenViewOnce(send));

    rerender();
    rerender();

    expect(send).toHaveBeenCalledTimes(1);
  });

  // 조건이 바뀌면 send 함수가 새로 만들어지지만 화면은 그대로 남아 있다
  it('조건이 바뀌어 send가 새 함수가 되어도 다시 보내지 않는다', () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ category }: { category: string }) =>
        useScreenViewOnce(() => {
          calls.push(category);
        }),
      { initialProps: { category: 'all' } },
    );

    rerender({ category: 'casual' });
    rerender({ category: 'goods' });

    expect(calls).toEqual(['all']);
  });

  it('화면을 다시 열면 보낸다', () => {
    const send = vi.fn();
    const first = renderHook(() => useScreenViewOnce(send));
    first.unmount();

    renderHook(() => useScreenViewOnce(send));

    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe('useToggleCart', () => {
  it('담기지 않은 상태에서 담으면 cart_add를 남긴다', () => {
    const { result } = renderHook(() => useToggleCart('p1'));

    act(() => result.current.toggle());

    expect(tracked).toEqual([
      { event: 'cart_add', properties: expect.objectContaining({ productId: 'p1', quantity: 1 }) },
    ]);
    expect(useCartStore.getState().productIds.has('p1')).toBe(true);
  });

  // 같은 버튼이 빼기도 한다. 클릭을 기준으로 세면 뺀 것도 담은 것으로 잡힌다
  it('담긴 상태에서 빼면 아무 이벤트도 남기지 않는다', () => {
    useCartStore.setState({ productIds: new Set(['p1']) });
    const { result } = renderHook(() => useToggleCart('p1'));

    act(() => result.current.toggle());

    expect(tracked).toEqual([]);
    expect(useCartStore.getState().productIds.has('p1')).toBe(false);
  });

  it('담았다 뺐다 다시 담으면 두 번 남는다', () => {
    const { result } = renderHook(() => useToggleCart('p1'));

    act(() => result.current.toggle());
    act(() => result.current.toggle());
    act(() => result.current.toggle());

    expect(tracked.map((row) => row.event)).toEqual(['cart_add', 'cart_add']);
  });
});

describe('useToggleWishlist', () => {
  it('찜하면 wishlist_add를 남긴다', () => {
    const { result } = renderHook(() => useToggleWishlist('p2'));

    act(() => result.current.toggle());

    expect(tracked).toEqual([
      { event: 'wishlist_add', properties: expect.objectContaining({ productId: 'p2' }) },
    ]);
  });

  it('찜을 풀면 아무 이벤트도 남기지 않는다', () => {
    useWishlistStore.setState({ productIds: new Set(['p2']) });
    const { result } = renderHook(() => useToggleWishlist('p2'));

    act(() => result.current.toggle());

    expect(tracked).toEqual([]);
  });
});
