'use client'

import {
  useIsInWishlist,
  useToggleWishlist,
} from '@/entities/wishlist/model/wishlist'

interface WishlistToggleButtonProps {
  productId: string
  productName: string
}

// 찜 행위만 담당한다. 자기 상품의 포함 여부와 action만 구독한다.
export default function WishlistToggleButton({
  productId,
  productName,
}: WishlistToggleButtonProps) {
  const isInWishlist = useIsInWishlist(productId)
  const toggleWishlist = useToggleWishlist()

  return (
    <button
      type="button"
      aria-label={`${productName} 위시리스트`}
      aria-pressed={isInWishlist}
      onClick={() => toggleWishlist(productId)}
    >
      {isInWishlist ? '찜 해제' : '찜'}
    </button>
  )
}
