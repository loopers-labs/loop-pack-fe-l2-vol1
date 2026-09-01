'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { ordersQueryOptions } from '../api/ordersQueries';

/**
 * 주문 내역. 서버에서 prefetch 된 캐시를 hydrate 받아 조회한다.
 * 로딩, 에러는 상위 OrdersPageBoundary 의 Suspense, ErrorBoundary 가 맡고,
 * 여기서는 데이터가 있는 성공 경로와 빈 상태만 다룬다.
 */
export function OrdersPage() {
  const { data } = useSuspenseQuery(ordersQueryOptions.list());

  const { orders } = data;

  return (
    <section className="week05-section">
      <h1>주문 내역</h1>

      {orders.length === 0 ? (
        <p>주문 내역이 없습니다.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <strong>주문 {order.id}</strong>
              <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</time>
              <span>{order.items.length}종</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
