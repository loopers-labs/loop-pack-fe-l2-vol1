'use client'

import { useWishlistStore } from '@/entities/wishlist'
import styles from './WishlistButton.module.css'

type WishlistButtonProps = {
  productId: string
  productName: string
}

// 목표 책임은 위시리스트 추가다. 이번 FSD 전환에서는 동작 기준선을 보존하기 위해
// 기존 toggle을 임시로 사용하고, 제거 행위는 향후 위시리스트 화면에서 분리한다.
export const WishlistButton = ({ productId, productName }: WishlistButtonProps) => {
  const isWishlisted = useWishlistStore((state) => state.ids.includes(productId))
  const toggleWishlist = useWishlistStore((state) => state.toggle)

  return (
    <button
      className={styles.button}
      type="button"
      aria-label={`${productName} 위시리스트`}
      aria-pressed={isWishlisted}
      onClick={() => toggleWishlist(productId)}
    >
      찜
    </button>
  )
}
