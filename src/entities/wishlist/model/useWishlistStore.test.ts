import { beforeEach, describe, expect, it } from 'vitest';
import { useWishlistStore } from './useWishlistStore';

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
  });

  it('처음엔 빈 위시리스트로 시작한다', () => {
    expect(useWishlistStore.getState().productIds.size).toBe(0);
  });

  it('setSingleIdInWishlist는 없던 id를 추가한다', () => {
    useWishlistStore.getState().setSingleIdInWishlist('p1');

    expect(useWishlistStore.getState().productIds.has('p1')).toBe(true);
  });

  it('setSingleIdInWishlist는 이미 있는 id면 제거한다 (토글)', () => {
    useWishlistStore.getState().setSingleIdInWishlist('p1');
    useWishlistStore.getState().setSingleIdInWishlist('p1');

    expect(useWishlistStore.getState().productIds.has('p1')).toBe(false);
  });

  it('여러 id를 서로 독립적으로 관리한다', () => {
    useWishlistStore.getState().setSingleIdInWishlist('p1');
    useWishlistStore.getState().setSingleIdInWishlist('p2');

    const { productIds } = useWishlistStore.getState();
    expect(productIds.has('p1')).toBe(true);
    expect(productIds.has('p2')).toBe(true);
    expect(productIds.size).toBe(2);
  });
});
