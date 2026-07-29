// @vitest-environment jsdom
// [AI] 위시리스트 store 계약 검증 (week-06 0단계 권장 테스트).
// 장바구니와 대칭되는 toggle/remove/clear 액션과 selector를 보호한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useWishlistStore,
  useWishlistCount,
  useIsInWishlist,
  useWishlistHasHydrated,
} from './wishlist';

beforeEach(() => {
  localStorage.clear();
  useWishlistStore.setState({ items: [], hasHydrated: false });
});

describe('useWishlistStore — toggle', () => {
  it('없는 아이템을 추가한다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    expect(useWishlistStore.getState().items).toEqual([{ id: 'p1' }]);
  });

  it('이미 있는 아이템은 제거한다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    useWishlistStore.getState().toggle({ id: 'p1' });
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('여러 아이템을 독립적으로 토글한다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    useWishlistStore.getState().toggle({ id: 'p2' });
    expect(useWishlistStore.getState().items).toEqual([{ id: 'p1' }, { id: 'p2' }]);

    useWishlistStore.getState().toggle({ id: 'p1' });
    expect(useWishlistStore.getState().items).toEqual([{ id: 'p2' }]);
  });
});

describe('useWishlistStore — remove', () => {
  it('id로 아이템을 제거한다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    useWishlistStore.getState().toggle({ id: 'p2' });
    useWishlistStore.getState().remove('p1');
    expect(useWishlistStore.getState().items).toEqual([{ id: 'p2' }]);
  });

  it('없는 id를 제거해도 변화 없다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    useWishlistStore.getState().remove('p9');
    expect(useWishlistStore.getState().items).toEqual([{ id: 'p1' }]);
  });
});

describe('useWishlistStore — clear', () => {
  it('아이템을 모두 비운다', () => {
    useWishlistStore.getState().toggle({ id: 'p1' });
    useWishlistStore.getState().toggle({ id: 'p2' });
    useWishlistStore.getState().clear();
    expect(useWishlistStore.getState().items).toEqual([]);
  });
});

describe('useWishlistStore — selectors', () => {
  it('useWishlistCount 는 items 길이를 파생한다', () => {
    const { result } = renderHook(() => useWishlistCount());
    expect(result.current).toBe(0);

    act(() => {
      useWishlistStore.getState().toggle({ id: 'p1' });
      useWishlistStore.getState().toggle({ id: 'p2' });
    });
    expect(result.current).toBe(2);

    act(() => {
      useWishlistStore.getState().remove('p1');
    });
    expect(result.current).toBe(1);
  });

  it('useIsInWishlist 는 해당 id 포함 여부를 파생한다', () => {
    const { result } = renderHook(() => useIsInWishlist('p1'));
    expect(result.current).toBe(false);

    act(() => {
      useWishlistStore.getState().toggle({ id: 'p1' });
    });
    expect(result.current).toBe(true);

    act(() => {
      useWishlistStore.getState().toggle({ id: 'p1' });
    });
    expect(result.current).toBe(false);
  });

  it('useWishlistHasHydrated 는 setHasHydrated 를 반영한다', () => {
    const { result } = renderHook(() => useWishlistHasHydrated());
    expect(result.current).toBe(false);

    act(() => {
      useWishlistStore.getState().setHasHydrated(true);
    });
    expect(result.current).toBe(true);
  });
});
