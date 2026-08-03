'use client'

import {
  useWishlistStore,
  wishlistSelectors,
} from '@/entities/wishlist/model/WishlistStore'

type ToggleWishlistButtonProps = {
  productId: string
  productName: string
}

export function ToggleWishlistButton({
  productId,
  productName,
}: ToggleWishlistButtonProps) {
  const isInWishlist = useWishlistStore(
    wishlistSelectors.isInWishlist(productId),
  )
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist)

  return (
    <button
      type="button"
      aria-pressed={isInWishlist}
      aria-label={`${productName} 위시리스트`}
      onClick={() => {
        toggleWishlist(productId)
      }}
      className="flex-1 rounded border border-(--color-border) px-3 py-2 text-xs text-(--color-text) hover:bg-(--color-surface-muted)"
    >
      {isInWishlist ? '찜 해제' : '찜'}
    </button>
  )
}
