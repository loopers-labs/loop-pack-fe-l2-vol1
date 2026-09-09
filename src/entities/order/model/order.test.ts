import { describe, expect, it } from 'vitest';
import { toRecentFirst } from './order';
import type { Order } from './order';

/** 서버가 덧붙이는 순서를 흉내낸다 — 먼저 만든 주문이 배열 앞에 온다 */
function makeOrders(ids: string[]): Order[] {
  return ids.map((id) => ({
    id,
    createdAt: '2026-09-01T11:02:17.481Z',
    items: [{ productId: 'p1', quantity: 1 }],
  }));
}

describe('toRecentFirst', () => {
  it('최근 주문이 앞에 오도록 뒤집는다', () => {
    const orders = makeOrders(['o1', 'o2', 'o3']);

    expect(toRecentFirst(orders).map((order) => order.id)).toEqual(['o3', 'o2', 'o1']);
  });

  // 같은 시각에 들어온 주문도 순서가 정해져야 한다. createdAt으로 정렬하면 이 경우가 흔들린다
  it('주문일시가 모두 같아도 들어온 순서의 역순을 지킨다', () => {
    const orders = makeOrders(['o1', 'o2', 'o3', 'o4']);

    expect(toRecentFirst(orders).map((order) => order.id)).toEqual(['o4', 'o3', 'o2', 'o1']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const orders = makeOrders(['o1', 'o2']);

    toRecentFirst(orders);

    expect(orders.map((order) => order.id)).toEqual(['o1', 'o2']);
  });

  it('빈 목록과 한 건짜리 목록도 그대로 다룬다', () => {
    expect(toRecentFirst([])).toEqual([]);
    expect(toRecentFirst(makeOrders(['o1'])).map((order) => order.id)).toEqual(['o1']);
  });
});
