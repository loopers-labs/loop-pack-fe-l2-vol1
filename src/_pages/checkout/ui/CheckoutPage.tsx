'use client'

import type { JSX } from 'react'
import { useCartIds } from '@/entities/cart'
import { CreateOrderButton } from '@/features/create-order'

export function CheckoutPage(): JSX.Element {
  const cartIds = useCartIds()

  return (
    <main className="week05-page commerce-order-page">
      <section className="week05-section" aria-labelledby="checkout-heading">
        <h1 id="checkout-heading">주문서</h1>
        <p>총 {cartIds.length}개 상품</p>
        {cartIds.length > 0 && (
          <ul className="commerce-order-items" aria-label="장바구니 상품">
            {cartIds.map((productId) => (
              <li key={productId}>{productId}</li>
            ))}
          </ul>
        )}
        <CreateOrderButton />
      </section>
    </main>
  )
}
