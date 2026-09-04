'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { analyticsEvents } from '@/analytics/events'
import { useCartStore } from '@/entities/cart/model/CartStore'
import { orderEntity } from '@/entities/order/api/OrderService'
import { ApiClientError } from '@/shared/api/ApiClientError'
import { useHydratePersistedStore } from '@/shared/lib/useHydratePersistedStore'

type CheckoutViewProps = {
  readonly userId: string
}

export function CheckoutView({ userId }: CheckoutViewProps) {
  useHydratePersistedStore(useCartStore)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const queryClient = useQueryClient()
  const router = useRouter()
  const orderItems = Object.keys(items)
    .sort()
    .map((productId) => ({ productId, quantity: 1 }))
  const orderStartedRef = useRef(false)

  useEffect(() => {
    if (orderStartedRef.current || orderItems.length === 0) {
      return
    }
    orderStartedRef.current = true
    analyticsEvents.orderStart({
      itemCount: orderItems.length,
      productIds: orderItems.map((item) => item.productId),
    })
  }, [orderItems])
  const createOrder = useMutation({
    ...orderEntity.createOrder(),
    onSuccess: async ({ order }) => {
      analyticsEvents.orderComplete({
        orderId: order.id,
        itemCount: orderItems.length,
        productIds: orderItems.map((item) => item.productId),
      })
      clearCart()
      await queryClient.invalidateQueries(orderEntity.getOrders(userId))
      router.replace('/orders')
      router.refresh()
    },
  })

  if (orderItems.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-(--color-ink)">주문서</h1>
        <p role="status" className="mt-5 text-(--color-muted)">
          장바구니가 비어 있습니다.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex min-h-11 items-center font-semibold text-(--color-ink) underline underline-offset-4"
        >
          상품 둘러보기
        </Link>
      </main>
    )
  }

  const errorMessage =
    createOrder.error instanceof ApiClientError
      ? createOrder.error.message
      : createOrder.error === null
        ? null
        : '주문 중 오류가 발생했습니다. 다시 시도해 주세요.'

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold text-(--color-ink)">주문서</h1>
      <ul className="mt-8 border-y border-(--color-border)">
        {orderItems.map((item) => (
          <li
            key={item.productId}
            className="flex items-center justify-between border-b border-(--color-border) py-4 last:border-b-0"
          >
            <span className="font-semibold text-(--color-ink)">
              {item.productId}
            </span>
            <span className="text-sm text-(--color-muted)">
              수량 {item.quantity}
            </span>
          </li>
        ))}
      </ul>
      {errorMessage === null ? null : (
        <p role="alert" className="mt-5 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        disabled={createOrder.isPending}
        onClick={() => {
          createOrder.mutate(orderItems)
        }}
        className="mt-8 min-h-11 rounded bg-(--color-ink) px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createOrder.isPending ? '주문 중…' : '주문하기'}
      </button>
    </main>
  )
}
