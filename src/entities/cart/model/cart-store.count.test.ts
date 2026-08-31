import { beforeEach, describe, expect, it } from 'vitest';

import { useCartStore } from './cart-store';

// 각 테스트마다 스토어를 초기화해준다.
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

const cartItems = () => useCartStore.getState().items;

const cartProductIds = () => cartItems().map((item) => item.productId);

const cartCount = () => cartItems().length;

const toggleCart = (productId: string) =>
  useCartStore.getState().actions.toggle(productId);

const setQuantity = (productId: string, quantity: number) =>
  useCartStore.getState().actions.setQuantity(productId, quantity);

const removeItems = (productIds: string[]) =>
  useCartStore.getState().actions.removeItems(productIds);

it('서로 다른 상품을 담은 만큼 항목 수가 늘어난다', () => {
  toggleCart('p1');
  expect(cartCount()).toBe(1);

  toggleCart('p2');
  expect(cartCount()).toBe(2);
});

it('이미 담은 상품을 다시 누르면 그 상품만 빠진다', () => {
  toggleCart('p1');
  toggleCart('p2');
  toggleCart('p1');

  expect(cartProductIds()).toEqual(['p2']);
});

describe('수량 변경', () => {
  it.each([
    ['0', 0],
    ['음수', -2],
    ['소수', 1.5],
    ['안전한 정수 범위 밖', Number.MAX_SAFE_INTEGER + 1],
  ])('1 이상의 안전한 정수가 아닌 수량(%s)은 무시한다', (_, quantity) => {
    toggleCart('p1');

    setQuantity('p1', quantity);

    expect(cartItems()).toEqual([{ productId: 'p1', quantity: 1 }]);
  });
});

describe('주문 상품 일괄 제거', () => {
  it('지정한 상품들만 빠지고 나머지는 남는다', () => {
    toggleCart('p1');
    toggleCart('p2');
    toggleCart('p3');

    removeItems(['p1', 'p3']);

    expect(cartProductIds()).toEqual(['p2']);
  });
});
