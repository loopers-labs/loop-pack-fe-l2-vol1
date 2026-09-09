'use client'

import Link from 'next/link'

import { useAuth } from '@/entities/auth/model/AuthProvider'
import { cartSelectors, useCartStore } from '@/entities/cart/model/CartStore'
import {
  useWishlistStore,
  wishlistSelectors,
} from '@/entities/wishlist/model/WishlistStore'
import { LogoutButton } from '@/features/logout/ui/LogoutButton'
import { useHydratePersistedStore } from '@/shared/lib/useHydratePersistedStore'

export function Header() {
  useHydratePersistedStore(useCartStore)
  useHydratePersistedStore(useWishlistStore)

  const cartCount = useCartStore(cartSelectors.count)
  const wishlistCount = useWishlistStore(wishlistSelectors.count)
  const { session } = useAuth()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--color-border) px-6 py-4">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-lg font-extrabold text-(--color-ink)"
      >
        Commerce
      </Link>
      <nav
        aria-label="주요 메뉴"
        className="flex flex-wrap items-center justify-end gap-3"
      >
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center rounded px-2 text-sm text-(--color-text) hover:bg-(--color-surface-muted) hover:text-(--color-ink)"
        >
          상품
        </Link>
        <span
          role="status"
          aria-label={`위시리스트 ${String(wishlistCount)}개`}
          className="text-sm text-(--color-muted)"
        >
          위시리스트 {wishlistCount}개
        </span>
        <span
          role="status"
          aria-label={`장바구니 ${String(cartCount)}개`}
          className="text-sm text-(--color-muted)"
        >
          장바구니 {cartCount}개
        </span>
        {session.status === 'authenticated' ? (
          <>
            <Link
              href="/checkout"
              className="inline-flex min-h-11 items-center rounded px-2 text-sm text-(--color-text) hover:bg-(--color-surface-muted) hover:text-(--color-ink)"
            >
              주문서
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center rounded px-2 text-sm text-(--color-text) hover:bg-(--color-surface-muted) hover:text-(--color-ink)"
            >
              주문 내역
            </Link>
            <span className="text-sm font-semibold text-(--color-ink)">
              <span className="sr-only">로그인 사용자 </span>
              {session.user.name}
            </span>
            <LogoutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded px-3 text-sm font-semibold text-(--color-ink) hover:bg-(--color-surface-muted)"
          >
            로그인
          </Link>
        )}
      </nav>
    </header>
  )
}
