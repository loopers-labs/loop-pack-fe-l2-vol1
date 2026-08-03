'use client'

import { useCartStore } from '@/entities/cart'
import styles from './AddCartButton.module.css'

type AddCartButtonProps = {
  productId: string
  productName: string
}

// 목표 책임은 장바구니 추가다. 이번 FSD 전환에서는 동작 기준선을 보존하기 위해
// 기존 toggle을 임시로 사용하고, 삭제·수정은 향후 장바구니 화면에서 분리한다.
export const AddCartButton = ({ productId, productName }: AddCartButtonProps) => {
  const isInCart = useCartStore((state) => state.ids.includes(productId))
  const toggleCart = useCartStore((state) => state.toggle)

  return (
    <button
      className={styles.button}
      type="button"
      aria-label={`${productName} 장바구니`}
      aria-pressed={isInCart}
      onClick={() => toggleCart(productId)}
    >
      담기
    </button>
  )
}
