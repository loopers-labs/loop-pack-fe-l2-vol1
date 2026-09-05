'use client'

import Link from 'next/link'
import { useCartCount } from '@/entities/cart/model/cart'
import { useWishlistCount } from '@/entities/wishlist/model/wishlist'

// 헤더는 개수만 구독한다. length가 그대로면 목록이 바뀌어도 리렌더가 없다.
export default function HeaderCounts() {
  const wishlistCount = useWishlistCount()
  const cartCount = useCartCount()

  return (
    <>
      <span>Wishlist {wishlistCount}</span>
      {/* 주문서로 가는 입구다. 링크로 두면 초기 HTML에 남아 JavaScript 실행 전에도 이동된다.
          prefetch를 끄는 이유는 보호 경로이기 때문이다. 로그아웃 상태에서 미리 받아두면
          로그인 화면으로 가는 리다이렉트가 라우터 캐시에 남고, 로그인 직후 이 경로로
          이동해도 캐시에 남은 리다이렉트가 먼저 적용된다. */}
      <Link href="/orders/new" prefetch={false}>
        Bag {cartCount}
      </Link>
    </>
  )
}
