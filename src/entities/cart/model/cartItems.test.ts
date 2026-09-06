import { describe, expect, it } from 'vitest';
import { mergeCartItems } from './cartItems';

describe('mergeCartItems', () => {
  it('기존 Map을 바꾸지 않고 같은 상품 수량을 합산한다', () => {
    const currentItems = new Map([
      ['p1', { id: 'p1', quantity: 2 }],
    ]);

    const result = mergeCartItems(currentItems, [
      { id: 'p1', quantity: 3 },
      { id: 'p2', quantity: 1 },
    ]);

    expect(currentItems.get('p1')?.quantity).toBe(2);
    expect(result.get('p1')).toEqual({ id: 'p1', quantity: 5 });
    expect(result.get('p2')).toEqual({ id: 'p2', quantity: 1 });
  });

  it('잘못된 수량은 제외하고 합계가 안전한 정수 범위를 넘지 않게 한다', () => {
    const currentItems = new Map([
      ['p1', { id: 'p1', quantity: Number.MAX_SAFE_INTEGER }],
    ]);

    const result = mergeCartItems(currentItems, [
      { id: 'p1', quantity: 1 },
      { id: 'invalid', quantity: 0 },
    ]);

    expect(result.get('p1')?.quantity).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.has('invalid')).toBe(false);
  });
});
