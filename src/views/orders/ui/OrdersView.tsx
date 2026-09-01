'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { orderEntity } from '@/entities/order/api/OrderService'
import { ApiClientError } from '@/shared/api/ApiClientError'

type OrdersViewProps = {
  readonly userId: string
}

export function OrdersView({ userId }: OrdersViewProps) {
  const orders = useQuery(orderEntity.getOrders(userId))

  if (orders.isPending) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-(--color-ink)">
          주문 내역
        </h1>
        <p role="status" className="mt-5 text-(--color-muted)">
          주문 내역을 불러오는 중입니다.
        </p>
      </main>
    )
  }

  if (orders.isError) {
    const message =
      orders.error instanceof ApiClientError
        ? orders.error.message
        : '주문 내역을 불러오지 못했습니다.'
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-(--color-ink)">
          주문 내역
        </h1>
        <p role="alert" className="mt-5 text-red-700">
          {message}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-(--color-ink)">주문 내역</h1>
      {orders.data.orders.length === 0 ? (
        <p role="status" className="mt-5 text-(--color-muted)">
          아직 주문 내역이 없습니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.data.orders.map((order) => (
            <li
              key={order.id}
              className="border-b border-(--color-border) pb-5"
            >
              <p className="font-bold text-(--color-ink)">{order.id}</p>
              <time
                dateTime={order.createdAt}
                className="mt-1 block text-sm text-(--color-muted)"
              >
                {new Date(order.createdAt).toLocaleString('ko-KR')}
              </time>
              <ul className="mt-3 space-y-1 text-sm text-(--color-text)">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.productId} × {item.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/products"
        className="mt-8 inline-flex min-h-11 items-center font-semibold text-(--color-ink) underline underline-offset-4"
      >
        상품 계속 보기
      </Link>
    </main>
  )
}
