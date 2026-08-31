// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { WISHLIST_STORAGE_KEY, useWishlistStore } from './wishlistStore';

describe('useWishlistStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useWishlistStore.setState({ ids: new Set(), isHydrated: false });
  });

  it('서로 다른 두 상품을 찜하면 개수가 2가 되고 두 상품을 조회할 수 있다', () => {
    const { toggle } = useWishlistStore.getState();

    toggle('p1');
    toggle('p2');

    const state = useWishlistStore.getState();
    expect(state.ids.size).toBe(2);
    expect(state.has('p1')).toBe(true);
    expect(state.has('p2')).toBe(true);
  });

  it('두 상품 중 하나를 다시 누르면 그 상품만 찜에서 빠진다', () => {
    const { toggle } = useWishlistStore.getState();

    toggle('p1');
    toggle('p2');
    toggle('p1');

    const state = useWishlistStore.getState();
    expect(state.ids.size).toBe(1);
    expect(state.has('p1')).toBe(false);
    expect(state.has('p2')).toBe(true);
  });

  it('저장한 상품 id를 새 store 수명에서 복원한다', async () => {
    const { toggle } = useWishlistStore.getState();
    toggle('p1');
    toggle('p2');
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);

    expect(stored).not.toBeNull();
    useWishlistStore.setState({ ids: new Set() });
    localStorage.setItem(WISHLIST_STORAGE_KEY, stored ?? '');
    await useWishlistStore.persist.rehydrate();

    expect(Array.from(useWishlistStore.getState().ids)).toEqual(['p1', 'p2']);
  });

  it('손상된 저장값은 빈 위시리스트로 복구한다', async () => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, '{broken');

    await useWishlistStore.persist.rehydrate();

    expect(useWishlistStore.getState().ids.size).toBe(0);
  });
});
