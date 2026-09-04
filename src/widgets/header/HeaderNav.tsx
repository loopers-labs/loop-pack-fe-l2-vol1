'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { type WishlistEntryPoint } from '@/analytics/app-events'
import { selectCartCount, useCartStore } from '@/entities/cart'
import type { SessionUser } from '@/entities/session'
import { selectWishlistCount, useWishlistStore } from '@/entities/wishlist'
import { LogoutButton } from '@/features/logout'
import { toLoginPath } from '@/shared/lib/to-login-path'
import styles from './Header.module.css'

type HeaderNavProps = {
  // 서버에서 읽은 세션. Header가 넘겨주므로 이 컴포넌트는 세션을 조회하지 않는다.
  user: SessionUser | null
}

export const HeaderNav = ({ user }: HeaderNavProps) => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // 개수는 별도 상태로 저장하지 않고 현재 소유자의 목록 길이에서 파생한다.
  // 장바구니 배지는 담긴 상품의 종류 수이고 수량 합이 아니다.
  // persist store를 훅으로 읽으면 zustand가 getServerSnapshot을 초기값으로 돌려줘
  // hydration 렌더에서 서버와 같은 값을 그린다 → 별도 hydration 가드가 필요 없다.
  const wishlistCount = useWishlistStore(selectWishlistCount)
  const cartCount = useCartStore(selectCartCount)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const avatarLabel = user?.name.slice(0, 2).toUpperCase() ?? ''
  const wishlistPath = (entryPoint: WishlistEntryPoint) =>
    `/wishlist?${new URLSearchParams({ entryPoint }).toString()}`

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
        {/*
          두 화면이 생기면서 span에서 Link가 됐다. 하는 일이 화면 이동이라 button이 아니라 Link이고,
          보호 경로지만 미로그인 링크는 유입 위치를 남기기 위해 로그인 경로를 직접 만든다.
          서버 가드는 주소 직접 진입을 계속 담당한다.

          숫자는 로그인 상태에서만 붙인다(decisions.md 3번). 미로그인에게 "위시리스트 0"을 보여주면
          비어 있다고 읽히는데, 실제로는 목록이 없는 게 아니라 볼 수 없는 상태다.
        */}
        <Link
          href={
            user === null
              ? toLoginPath('/wishlist', { entryPoint: 'header_wishlist' })
              : wishlistPath('header_wishlist')
          }
          aria-current={pathname === '/wishlist' ? 'page' : undefined}
        >
          위시리스트{user !== null && ` ${wishlistCount}`}
        </Link>
        <Link
          href={user === null ? toLoginPath('/cart', { entryPoint: 'header_cart' }) : '/cart'}
          aria-current={pathname === '/cart' ? 'page' : undefined}
        >
          장바구니{user !== null && ` ${cartCount}`}
        </Link>
        {user === null ? (
          <Link
            href={toLoginPath(pathname, { entryPoint: 'header_login' })}
            aria-current={pathname === '/login' ? 'page' : undefined}
          >
            로그인
          </Link>
        ) : (
          <div className={styles.account} ref={menuRef}>
            <button
              ref={triggerRef}
              className={styles.avatar}
              type="button"
              aria-label={`${user.name} 계정 메뉴`}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            >
              {avatarLabel}
            </button>
            {isMenuOpen && (
              <div className={styles.menu} role="menu" aria-label="계정 메뉴">
                <p className={styles.accountName}>{user.name}</p>
                <Link href="/mypage" role="menuitem" onClick={() => setIsMenuOpen(false)}>
                  마이페이지
                </Link>
                <LogoutButton />
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
