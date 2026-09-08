'use client'

import { useQuery } from '@tanstack/react-query'
import type { JSX } from 'react'
import { PRIVATE_ORDER_QUERY_KEY } from '@/entities/order'
import { getOrders } from '@/features/create-order'

export function OrderListPage(): JSX.Element {
  const { data, error, fetchStatus, isError, isFetching, isPending } = useQuery(
    {
      queryKey: PRIVATE_ORDER_QUERY_KEY,
      queryFn: ({ signal }) => getOrders(signal),
    },
  )
  const orders = data ?? []
  const isUnverified = isPending || isFetching || fetchStatus === 'paused'

  return (
    <main className="week05-page commerce-order-page">
      <section className="week05-section" aria-labelledby="orders-heading">
        <h1 id="orders-heading">주문 내역</h1>
        {isUnverified ? (
          <p
            className="commerce-status"
            role="status"
            aria-label="주문 내역 로딩"
          >
            주문 내역을 불러오는 중입니다.
          </p>
        ) : isError ? (
          <p className="commerce-inline-error" role="alert">
            {error.message}
          </p>
        ) : orders.length === 0 ? (
          <p className="commerce-empty">주문 내역이 없습니다.</p>
        ) : (
          <ol className="commerce-order-list" aria-label="주문 내역">
            {orders.map((order) => (
              <li key={order.id}>
                <article
                  className="commerce-order-card"
                  aria-labelledby={`order-${order.id}-heading`}
                >
                  <h2 id={`order-${order.id}-heading`}>주문 {order.id}</h2>
                  <p>주문 번호: {order.id}</p>
                  <time dateTime={order.createdAt}>{order.createdAt}</time>
                  <ul
                    className="commerce-order-items"
                    aria-label={`주문 ${order.id} 상품 목록`}
                  >
                    {order.items.map((item, itemIndex) => (
                      <li key={`${order.id}-${item.productId}-${itemIndex}`}>
                        <span>상품 ID: {item.productId}</span>{' '}
                        <span>수량: {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}
