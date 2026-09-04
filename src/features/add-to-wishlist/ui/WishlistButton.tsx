'use client'

import type { ProductSummary } from '@/entities/product'
import { APP_EVENT } from '@/analytics/app-events'
import { track } from '@/analytics/logger'
import { selectHasWishlistOwner, selectIsWishlisted, useWishlistStore } from '@/entities/wishlist'
import { toLoginPath } from '@/shared/lib/to-login-path'
import styles from './WishlistButton.module.css'

type WishlistButtonProps = {
  product: ProductSummary
}

// 찜은 켜고 끄는 동작이라 toggle을 그대로 쓴다. 장바구니만 add/remove로 갈라졌다.
//
// id만이 아니라 상품 전체를 받는 것은 store가 표시 정보를 함께 들기 때문이다.
// 위시리스트 화면이 카드를 그리려면 이름·이미지·가격이 필요한데 상품을 id로 조회하는 API가 없다.
export const WishlistButton = ({ product }: WishlistButtonProps) => {
  const isWishlisted = useWishlistStore(selectIsWishlisted(product.id))
  const toggleWishlist = useWishlistStore((state) => state.toggle)
  const hasOwner = useWishlistStore(selectHasWishlistOwner)

  // 미로그인 처리는 담기 버튼과 같다(decisions.md 3번). 이유도 그쪽 주석과 같다.
  const handleClick = () => {
    if (!hasOwner) {
      const { pathname, search } = window.location
      window.location.assign(
        toLoginPath(`${pathname}${search}`, {
          entryPoint: 'product_wishlist',
          productId: product.id,
        }),
      )
      return
    }

    toggleWishlist(product)
    track(isWishlisted ? APP_EVENT.wishlistRemove : APP_EVENT.wishlistAdd, {
      product_id: product.id,
    })
  }

  return (
    <button
      className={styles.button}
      type="button"
      aria-label={`${product.name} 위시리스트`}
      aria-pressed={isWishlisted}
      onClick={handleClick}
    >
      찜
    </button>
  )
}
