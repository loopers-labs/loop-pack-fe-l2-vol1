'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { type WishlistEntryPoint } from '@/analytics/app-events'
import { selectCartCount, useCartStore } from '@/entities/cart'
import type { SessionUser } from '@/entities/session'
import { selectWishlistCount, useWishlistStore } from '@/entities/wishlist'
import { LogoutButton, useLogout } from '@/features/logout'
import { ROUTES } from '@/shared/config/routes'
import { toLoginPath } from '@/shared/lib/to-login-path'
import { NoticeBanner } from '@/shared/ui/NoticeBanner/NoticeBanner'
import styles from './Header.module.css'

type HeaderNavProps = {
  user: SessionUser | null
}

export const HeaderNav = ({ user }: HeaderNavProps) => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { logout, isPending: isLogoutPending, error: logoutError, reset: resetLogout } = useLogout()

  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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

  const isLoggedIn = user !== null
  const avatarLabel = user?.name.slice(0, 1).toUpperCase() ?? ''

  const wishlistPath = (entryPoint: WishlistEntryPoint) =>
    `${ROUTES.WISHLIST}?${new URLSearchParams({ entryPoint }).toString()}`

  const wishlistHref = isLoggedIn
    ? wishlistPath('header_wishlist')
    : toLoginPath(ROUTES.WISHLIST, { entryPoint: 'header_wishlist' })

  const cartHref = isLoggedIn
    ? ROUTES.CART
    : toLoginPath(ROUTES.CART, { entryPoint: 'header_cart' })

  return (
    <>
      <header className={styles.header}>
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
          Commerce
        </Link>
        <nav className={styles.navigation} aria-label="주요 메뉴">
          <Link href="/products" aria-current={pathname === '/products' ? 'page' : undefined}>
            상품
          </Link>
          <Link
            href={wishlistHref}
            aria-current={pathname === ROUTES.WISHLIST ? 'page' : undefined}
          >
            위시리스트{isLoggedIn && ` ${wishlistCount}`}
          </Link>
          <Link href={cartHref} aria-current={pathname === ROUTES.CART ? 'page' : undefined}>
            장바구니{isLoggedIn && ` ${cartCount}`}
          </Link>
          {!isLoggedIn ? (
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
                  <Link href={ROUTES.MYPAGE} role="menuitem" onClick={() => setIsMenuOpen(false)}>
                    마이페이지
                  </Link>
                  <LogoutButton onClick={() => logout()} isPending={isLogoutPending} />
                </div>
              )}
            </div>
          )}
        </nav>
      </header>
      {logoutError !== null && (
        <NoticeBanner
          label="로그아웃 오류"
          action={
            <>
              {/* 팝오버 밖 배너에서 로그아웃 재시도를 제공한다. */}
              <button
                type="button"
                onClick={() => logout()}
                disabled={isLogoutPending}
                aria-label="로그아웃 다시 시도"
              >
                다시 시도
              </button>
              <button type="button" onClick={resetLogout} aria-label="로그아웃 오류 닫기">
                닫기
              </button>
            </>
          }
        >
          {logoutError.message}
        </NoticeBanner>
      )}
    </>
  )
}
