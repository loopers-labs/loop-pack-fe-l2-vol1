'use client'

import { useShoppingStore } from '@/stores/shopping'

interface ShoppingToggleButtonsProps {
  productId: string
  productName: string
}

// 찜과 담기 행위만 담당한다. 자기 상품의 포함 여부(boolean)와 action만
// 구독하므로 다른 상품을 토글해도 리렌더되지 않는다.
export default function ShoppingToggleButtons({
  productId,
  productName,
}: ShoppingToggleButtonsProps) {
  const isInWishlist = useShoppingStore((state) =>
    state.wishlistIds.includes(productId),
  )
  const isInCart = useShoppingStore((state) =>
    state.cartIds.includes(productId),
  )
  const toggleWishlist = useShoppingStore((state) => state.toggleWishlist)
  const toggleCart = useShoppingStore((state) => state.toggleCart)

  return (
    <div>
      <button
        type="button"
        aria-label={`${productName} 위시리스트`}
        aria-pressed={isInWishlist}
        onClick={() => toggleWishlist(productId)}
      >
        {isInWishlist ? '찜 해제' : '찜'}
      </button>
      <button
        type="button"
        aria-label={`${productName} 장바구니`}
        aria-pressed={isInCart}
        onClick={() => toggleCart(productId)}
      >
        {isInCart ? '빼기' : '담기'}
      </button>
    </div>
  )
}
