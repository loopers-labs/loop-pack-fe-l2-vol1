'use client'

import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import styles from './ProductCard.module.css'

type ProductCardActionsProps = {
  productId: string
  productName: string
}

// 찜/담기 버튼만 담은 Client 리프. 카드 전체를 Client로 만들지 않도록 경계를 여기까지 내렸다.
// 각 버튼은 자기 상품의 담김 여부와 toggle action만 selector로 구독한다.
export const ProductCardActions = ({ productId, productName }: ProductCardActionsProps) => {
  // persist store를 훅으로 읽으면 zustand의 getServerSnapshot(초기값) 덕분에 hydration 렌더가
  // 서버와 일치한다 → 별도 hydration 가드 없이 그대로 구독한다.
  const isWishlisted = useWishlistStore((state) => state.ids.includes(productId))
  const isInCart = useCartStore((state) => state.ids.includes(productId))
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const toggleCart = useCartStore((state) => state.toggle)

  return (
    <div className={styles.actions}>
      <button
        type="button"
        aria-label={`${productName} 위시리스트`}
        aria-pressed={isWishlisted}
        onClick={() => toggleWishlist(productId)}
      >
        찜
      </button>
      <button
        type="button"
        aria-label={`${productName} 장바구니`}
        aria-pressed={isInCart}
        onClick={() => toggleCart(productId)}
      >
        담기
      </button>
    </div>
  )
}
