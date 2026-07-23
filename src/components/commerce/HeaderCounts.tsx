'use client'

import { useShoppingStore } from '@/stores/shopping'

// 헤더는 개수만 구독한다. length가 그대로면 목록이 바뀌어도 리렌더가 없다.
export default function HeaderCounts() {
  const wishlistCount = useShoppingStore((state) => state.wishlistIds.length)
  const cartCount = useShoppingStore((state) => state.cartIds.length)

  return (
    <>
      <span>위시리스트 {wishlistCount}</span>
      <span>장바구니 {cartCount}</span>
    </>
  )
}
