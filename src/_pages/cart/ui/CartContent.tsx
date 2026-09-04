'use client'

import Link from 'next/link'
import { selectCartItems, selectCartTotalPrice, useCartStore } from '@/entities/cart'
import { CartItemRow } from '@/_pages/cart/ui/CartItemRow'
import { ClearCartButton } from '@/_pages/cart/ui/ClearCartButton'
import { PlaceOrderButton } from '@/features/place-order'
import { formatPrice } from '@/shared/lib/format-price'
import { useHasHydrated } from '@/shared/lib/useHasHydrated'
import styles from './cart.module.css'

export const CartContent = () => {
  const items = useCartStore(selectCartItems)
  // 합계는 렌더 중 계산한다. store가 파생 selector로 소유해 주문서와 같은 값을 쓴다.
  const totalPrice = useCartStore(selectCartTotalPrice)
  const hasHydrated = useHasHydrated(useCartStore)

  if (!hasHydrated) {
    return null
  }

  // 담긴 게 없으면 주문서로 갈 수 없다. POST /api/orders의 400(빈 목록)을 화면에서 미리 막는다.
  if (items.length === 0) {
    return (
      <div className="layout-empty">
        <p>장바구니가 비어 있습니다.</p>
        <Link href="/products">상품 보러 가기</Link>
      </div>
    )
  }

  return (
    <>
      <div className={styles.toolbar}>
        <strong>담은 상품 {items.length}</strong>
        <ClearCartButton />
      </div>
      <ul className={styles.list}>
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>
      <div className={styles.summary}>
        <strong>합계 {formatPrice(totalPrice)}</strong>
      </div>
      <div className={styles.orderAction}>
        <PlaceOrderButton />
      </div>
    </>
  )
}
