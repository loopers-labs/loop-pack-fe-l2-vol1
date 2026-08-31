import { afterEach, describe, expect, it } from 'vitest';
import { accounts } from './auth';
import { orderRepository } from './orderRepository';

describe('orderRepository', () => {
  afterEach(() => {
    orderRepository.reset();
  });

  it('사용자별 주문을 분리한다', () => {
    const first = orderRepository.add(accounts[0].id, [
      { productId: 'p1', quantity: 2 },
    ]);
    orderRepository.add(accounts[1].id, [
      { productId: 'p2', quantity: 1 },
    ]);

    expect(orderRepository.list(accounts[0].id)).toEqual([first]);
    expect(orderRepository.list(accounts[1].id)).toHaveLength(1);
    expect(orderRepository.list('u999')).toEqual([]);
  });

  it('요청 상품을 유지하고 주문 번호를 순서대로 만든다', () => {
    const first = orderRepository.add(accounts[0].id, [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    const second = orderRepository.add(accounts[0].id, [
      { productId: 'p3', quantity: 1 },
    ]);

    expect(first.items).toEqual([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    expect(first.id).toBe('o1');
    expect(second.id).toBe('o2');
  });
});
