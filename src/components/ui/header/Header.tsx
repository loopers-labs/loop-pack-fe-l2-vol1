'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import styles from './Header.module.css'

export const Header = () => {
  const pathname = usePathname()
  // 개수는 별도 상태로 저장하지 않고 ids 길이에서 파생한다.
  // persist store를 훅으로 읽으면 zustand가 getServerSnapshot을 초기값으로 돌려줘
  // hydration 렌더에서 서버와 같은 값을 그린다 → 별도 hydration 가드가 필요 없다.
  const wishlistCount = useWishlistStore((state) => state.ids.length)
  const cartCount = useCartStore((state) => state.ids.length)

  return (
    <header className={styles.header}>
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
        Commerce
      </Link>
      <nav className={styles.navigation} aria-label="주요 메뉴">
        {/*
          상품 목록에 있을 때도 숨기지 않고 노출한다. 현재 위치는 aria-current="page"로 표시한다.
          재이동 용도: 필터가 걸린 /products?category=...&sort=... 상태에서 이 링크를 누르면
          쿼리 없는 /products로 이동해 nuqs 기본값(전체·최신순·1페이지)으로 리셋된다.
        */}
        <Link href="/products" aria-current={pathname === '/products' ? 'page' : undefined}>
          상품
        </Link>
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  )
}
