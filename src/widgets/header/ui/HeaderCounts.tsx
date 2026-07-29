'use client'

import { useCartCount } from '@/entities/cart/model/cart'
import { useWishlistCount } from '@/entities/wishlist/model/wishlist'

// 헤더는 개수만 구독한다. length가 그대로면 목록이 바뀌어도 리렌더가 없다.
export default function HeaderCounts() {
  const wishlistCount = useWishlistCount()
  const cartCount = useCartCount()

  return (
    <>
      <span>위시리스트 {wishlistCount}</span>
      <span>장바구니 {cartCount}</span>
    </>
  )
}
