'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrder, ORDERS_QUERY_KEY, type Order } from '../api/orders'
import { trackOrderComplete, trackOrderStart } from '@/analytics/events'
import { resetCart, useCartIds } from '@/entities/cart/model/cart'
import { errorMessageOf } from '@/shared/api/http'

const FALLBACK_MESSAGE = '주문하지 못했습니다. 잠시 후 다시 시도해주세요.'

// 주문서다. 담긴 상품과 수량을 확인하고 주문을 만든다.
// 수량은 이 화면에서만 쓰는 값이라 store 에 올리지 않는다. 장바구니는 무엇이 담겼는지만
// 기억하고, 몇 개를 주문할지는 주문서를 떠나면 사라지는 값이다.
export default function OrderForm() {
  const cartIds = useCartIds()
  const queryClient = useQueryClient()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [placed, setPlaced] = useState<Order | null>(null)
  const started = useRef(false)

  const quantityOf = (productId: string) => quantities[productId] ?? 1

  useEffect(() => {
    if (started.current) return
    started.current = true
    trackOrderStart({ productIds: cartIds, itemCount: cartIds.length })
  }, [cartIds])

  const { mutate, isPending, error } = useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) =>
      createOrder(items),
    onSuccess: ({ order }) => {
      trackOrderComplete({ orderId: order.id, itemCount: order.items.length })
      setPlaced(order)
      // 완료된 항목을 장바구니에서 지운다. 남겨두면 같은 주문을 다시 제출할 수 있다.
      resetCart()
      // 주문 내역 화면이 방금 만든 주문을 이미 지난 캐시로 보지 않게 한다.
      void queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
    },
  })

  if (placed !== null) {
    return (
      <main className="week09-orders">
        <h1>주문 완료</h1>
        <p>
          주문 번호 <strong data-testid="order-id">{placed.id}</strong>
        </p>
        <Link href="/orders">주문 내역 보기</Link>
      </main>
    )
  }

  return (
    <main className="week09-orders">
      <h1>주문서</h1>

      {cartIds.length === 0 ? (
        <p>
          담긴 상품이 없습니다. <Link href="/products">상품을 둘러보세요</Link>.
        </p>
      ) : (
        <form
          className="week09-order-form"
          onSubmit={(event) => {
            event.preventDefault()
            mutate(
              cartIds.map((productId) => ({
                productId,
                quantity: quantityOf(productId),
              })),
            )
          }}
        >
          <ul className="week09-order-list">
            {cartIds.map((productId) => (
              <li key={productId}>
                <label htmlFor={`quantity-${productId}`}>{productId}</label>
                <input
                  id={`quantity-${productId}`}
                  type="number"
                  min={1}
                  step={1}
                  value={quantityOf(productId)}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      // 빈 입력과 소수는 서버가 400으로 돌려준다. 화면에서도 최소 1로 잡아
                      // 사용자가 보낼 수 없는 값을 만들지 않게 한다.
                      [productId]: Math.max(
                        1,
                        Math.floor(Number(event.target.value) || 1),
                      ),
                    }))
                  }
                />
              </li>
            ))}
          </ul>

          {error ? (
            <p className="week09-auth-error" role="alert">
              {errorMessageOf(error, FALLBACK_MESSAGE)}
            </p>
          ) : null}

          <button type="submit" disabled={isPending}>
            {isPending ? '주문 중…' : '주문하기'}
          </button>
        </form>
      )}
    </main>
  )
}
