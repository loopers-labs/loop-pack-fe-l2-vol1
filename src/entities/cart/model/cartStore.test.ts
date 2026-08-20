import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: new Map(), lastAddedId: null });
  });

  it('같은 상품을 두 번 담으면 수량은 2가 되고 서로 다른 상품 수는 1을 유지한다', () => {
    const { addItem } = useCartStore.getState();

    addItem('p1');
    addItem('p1');

    const state = useCartStore.getState();
    expect(state.items.size).toBe(1);
    expect(state.items.get('p1')).toEqual({ id: 'p1', quantity: 2 });
    expect(state.lastAddedId).toBe('p1');
  });

  it('서로 다른 두 상품을 담으면 헤더에 사용할 상품 수가 2가 된다', () => {
    const { addItem } = useCartStore.getState();

    addItem('p1');
    addItem('p2');

    expect(useCartStore.getState().items.size).toBe(2);
  });

  it('상품 하나를 제거해도 나머지 상품과 수량은 유지한다', () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem('p1');
    addItem('p2');
    addItem('p2');

    removeItem('p1');

    const state = useCartStore.getState();
    expect(state.items.size).toBe(1);
    expect(state.items.get('p2')).toEqual({ id: 'p2', quantity: 2 });
  });
});
