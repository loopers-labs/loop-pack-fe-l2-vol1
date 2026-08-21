import { beforeEach, describe, expect, it } from 'vitest';
import { useWishlistStore } from './wishlistStore';

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ ids: new Set() });
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
});
