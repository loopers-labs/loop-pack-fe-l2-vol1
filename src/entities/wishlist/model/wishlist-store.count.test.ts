import { beforeEach, expect, it } from 'vitest';

import { useWishlistStore } from './wishlist-store';

// 각 테스트마다 스토어를 초기화해준다.
beforeEach(() => {
  useWishlistStore.setState({ productIds: [] });
});

const wishlistProductIds = () => useWishlistStore.getState().productIds;

const wishlistCount = () => wishlistProductIds().length;

const toggleWishlist = (productId: string) =>
  useWishlistStore.getState().actions.toggle(productId);

it('서로 다른 상품을 찜한 만큼 개수가 늘어난다', () => {
  toggleWishlist('p1');
  expect(wishlistCount()).toBe(1);

  toggleWishlist('p2');
  expect(wishlistCount()).toBe(2);
});

it('이미 찜한 상품을 다시 누르면 그 상품만 빠진다', () => {
  toggleWishlist('p1');
  toggleWishlist('p2');

  toggleWishlist('p1');

  expect(wishlistProductIds()).toEqual(['p2']);
});

it('찜한 상품을 모두 풀면 개수가 0으로 돌아온다', () => {
  toggleWishlist('p1');
  toggleWishlist('p2');

  toggleWishlist('p1');
  toggleWishlist('p2');

  expect(wishlistCount()).toBe(0);
});
