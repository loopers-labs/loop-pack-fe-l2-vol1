'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/shared/config/routes'
import { selectCartItems, selectCartTotalPrice, useCartStore } from '@/entities/cart'
import { PlaceOrderButton } from '@/features/place-order'
import { formatPrice } from '@/shared/lib/format-price'
import { useHasHydrated } from '@/shared/lib/useHasHydrated'
import styles from './checkout.module.css'

/* 주문 상품은 장바구니 store에서 담은 시점의 표시 정보를 함께 읽고, 금액은 직접 계산한다. */
export const CheckoutContent = () => {
  const items = useCartStore(selectCartItems)
  const totalPrice = useCartStore(selectCartTotalPrice)
  const hasHydrated = useHasHydrated(useCartStore)

  if (!hasHydrated) {
    return null
  }

  if (items.length === 0) {
    return (
      <p className="layout-empty">
        주문할 상품이 없습니다. <Link href={ROUTES.CART}>장바구니</Link>에서 상품을 담아주세요.
      </p>
    )
  }

  return (
    <>
      <h2 className={styles.sectionTitle}>주문 상품</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <Image
              className={styles.image}
              src={item.image}
              alt={item.name}
              width={64}
              height={64}
            />
            <span className={styles.name}>{item.name}</span>
            <span>× {item.quantity}</span>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        <span>결제 예정 금액</span>
        <strong>{formatPrice(totalPrice)}</strong>
      </p>
      <PlaceOrderButton />
    </>
  )
}
