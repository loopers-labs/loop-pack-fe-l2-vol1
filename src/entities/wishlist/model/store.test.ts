import { beforeEach, describe, expect, it } from 'vitest';
import { useWishlistStore } from './store';

// 장바구니와 같은 파생 규칙 — 두 슬라이스가 같은 규칙을 따르는지 각각 고정한다.
describe('위시리스트 스토어', () => {
  beforeEach(() => {
    useWishlistStore.setState({ wishlist: [] });
  });

  it('아무것도 찜하지 않았으면 목록이 비어 있어 개수가 0이다', () => {
    expect(useWishlistStore.getState().wishlist).toEqual([]);
  });

  it('찜하면 목록에 들어가고 다시 누르면 빠진다', () => {
    useWishlistStore.getState().toggleWish('p1');
    expect(useWishlistStore.getState().wishlist).toEqual(['p1']);

    useWishlistStore.getState().toggleWish('p1');
    expect(useWishlistStore.getState().wishlist).toEqual([]);
  });

  it('같은 상품을 세 번 눌러도 목록에 중복 항목이 생기지 않는다', () => {
    useWishlistStore.getState().toggleWish('p1');
    useWishlistStore.getState().toggleWish('p1');
    useWishlistStore.getState().toggleWish('p1');

    expect(useWishlistStore.getState().wishlist).toEqual(['p1']);
  });

  it('장바구니와 별개로 관리된다 — 찜해도 장바구니 목록은 그대로다', async () => {
    const { useCartStore } = await import('@/entities/cart/model/store');
    useCartStore.setState({ cart: [] });

    useWishlistStore.getState().toggleWish('p1');

    expect(useCartStore.getState().cart).toEqual([]);
  });
});
