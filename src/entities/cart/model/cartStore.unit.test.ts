import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/entities/cart';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: new Map([['p0', 1]]) });
  });

  it('담으면 수량 1로 들어가고, 다시 누르면 빠진다', () => {
    useCartStore.getState().toggle('p1');
    expect(useCartStore.getState().items.get('p1')).toBe(1);

    useCartStore.getState().toggle('p1');
    expect(useCartStore.getState().items.has('p1')).toBe(false);
  });

  it('수량을 바꾼다', () => {
    useCartStore.getState().setQuantity('p0', 4);
    expect(useCartStore.getState().items.get('p0')).toBe(4);
  });

  it('1 미만이거나 정수가 아닌 수량은 무시한다 — 서버가 400으로 거르는 조건과 같은 기준', () => {
    for (const invalid of [0, -1, 1.5, Number.NaN]) {
      useCartStore.getState().setQuantity('p0', invalid);
      expect(useCartStore.getState().items.get('p0')).toBe(1);
    }
  });

  it('담지 않은 상품의 수량은 바꿀 수 없다', () => {
    useCartStore.getState().setQuantity('p9', 3);
    expect(useCartStore.getState().items.has('p9')).toBe(false);
  });

  it('빼면 사라지고, 없는 것을 빼도 그대로다', () => {
    useCartStore.getState().remove('p0');
    expect(useCartStore.getState().items.size).toBe(0);

    useCartStore.getState().remove('p0');
    expect(useCartStore.getState().items.size).toBe(0);
  });
});
