'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersQueries } from '@/entities/order/api/ordersQueries';

export function OrderHistoryPage() {
  const { data: orders, isLoading, isError } = useQuery(ordersQueries.list());

  return (
    <section className="week05-section">
      <h1>주문내역</h1>

      {isLoading && <p>불러오는 중...</p>}
      {isError && (
        <p className="week05-error">주문 내역을 불러오지 못했습니다.</p>
      )}
      {orders && orders.length === 0 && <p>주문 내역이 없습니다.</p>}

      {orders && orders.length > 0 && (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <strong>{order.id}</strong> —{' '}
              {new Date(order.createdAt).toLocaleString('ko-KR')}
              <ul>
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.productId} × {item.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
