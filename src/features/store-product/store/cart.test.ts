// @vitest-environment jsdom
// [AI] 장바구니 store 계약 검증 (week-06 0단계 권장 테스트).
// toggle/remove/clear 액션과 useCartCount/useIsInCart 파생 selector를 보호한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore, useCartCount, useIsInCart, useCartHasHydrated } from './cart';

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [], hasHydrated: false });
});

describe('useCartStore — toggle', () => {
  it('없는 아이템을 추가한다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    expect(useCartStore.getState().items).toEqual([{ id: 'p1' }]);
  });

  it('이미 있는 아이템은 제거한다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    useCartStore.getState().toggle({ id: 'p1' });
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('여러 아이템을 독립적으로 토글한다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    useCartStore.getState().toggle({ id: 'p2' });
    expect(useCartStore.getState().items).toEqual([{ id: 'p1' }, { id: 'p2' }]);

    useCartStore.getState().toggle({ id: 'p1' });
    expect(useCartStore.getState().items).toEqual([{ id: 'p2' }]);
  });
});

describe('useCartStore — remove', () => {
  it('id로 아이템을 제거한다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    useCartStore.getState().toggle({ id: 'p2' });
    useCartStore.getState().remove('p1');
    expect(useCartStore.getState().items).toEqual([{ id: 'p2' }]);
  });

  it('없는 id를 제거해도 변화 없다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    useCartStore.getState().remove('p9');
    expect(useCartStore.getState().items).toEqual([{ id: 'p1' }]);
  });
});

describe('useCartStore — clear', () => {
  it('아이템을 모두 비운다', () => {
    useCartStore.getState().toggle({ id: 'p1' });
    useCartStore.getState().toggle({ id: 'p2' });
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('useCartStore — selectors', () => {
  it('useCartCount 는 items 길이를 파생한다', () => {
    const { result } = renderHook(() => useCartCount());
    expect(result.current).toBe(0);

    act(() => {
      useCartStore.getState().toggle({ id: 'p1' });
      useCartStore.getState().toggle({ id: 'p2' });
    });
    expect(result.current).toBe(2);

    act(() => {
      useCartStore.getState().remove('p1');
    });
    expect(result.current).toBe(1);
  });

  it('useIsInCart 는 해당 id 포함 여부를 파생한다', () => {
    const { result } = renderHook(() => useIsInCart('p1'));
    expect(result.current).toBe(false);

    act(() => {
      useCartStore.getState().toggle({ id: 'p1' });
    });
    expect(result.current).toBe(true);

    act(() => {
      useCartStore.getState().toggle({ id: 'p1' });
    });
    expect(result.current).toBe(false);
  });

  it('useCartHasHydrated 는 setHasHydrated 를 반영한다', () => {
    const { result } = renderHook(() => useCartHasHydrated());
    expect(result.current).toBe(false);

    act(() => {
      useCartStore.getState().setHasHydrated(true);
    });
    expect(result.current).toBe(true);
  });
});
