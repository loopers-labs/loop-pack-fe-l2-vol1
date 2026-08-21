import { beforeEach, expect, it } from 'vitest';

import { useCartStore } from './cart-store';

// 각 테스트마다 스토어를 초기화해준다.
beforeEach(() => {
  useCartStore.setState({ productIds: [] });
});

const cartProductIds = () => useCartStore.getState().productIds;

const cartCount = () => cartProductIds().length;

const isInCart = (productId: string) => cartProductIds().includes(productId);

const toggleCart = (productId: string) =>
  useCartStore.getState().actions.toggle(productId);

it('서로 다른 상품을 담은 만큼 개수가 늘어난다', () => {
  toggleCart('p1');
  expect(cartCount()).toBe(1);

  toggleCart('p2');
  expect(cartCount()).toBe(2);
});

it('이미 담은 상품을 다시 누르면 그 상품만 빠진다', () => {
  toggleCart('p1');
  toggleCart('p2');

  toggleCart('p1');

  expect(cartCount()).toBe(1);
  expect(isInCart('p1')).toBe(false);
  expect(isInCart('p2')).toBe(true);
});

it('담은 상품을 모두 빼면 개수가 0으로 돌아온다', () => {
  toggleCart('p1');
  toggleCart('p2');

  toggleCart('p1');
  toggleCart('p2');

  expect(cartCount()).toBe(0);
});
