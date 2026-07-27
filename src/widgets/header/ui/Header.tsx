'use client'

import Link from 'next/link'

import { cartSelectors, useCartStore } from '@/features/cart/model/CartStore'
import {
  useWishlistStore,
  wishlistSelectors,
} from '@/features/wishlist/model/WishlistStore'
import { useHydratePersistedStore } from '@/shared/lib/useHydratePersistedStore'

export function Header() {
  useHydratePersistedStore(useCartStore)
  useHydratePersistedStore(useWishlistStore)

  const cartCount = useCartStore(cartSelectors.count)
  const wishlistCount = useWishlistStore(wishlistSelectors.count)

  return (
    <header className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
      <Link href="/" className="text-lg font-extrabold text-(--color-ink)">
        Commerce
      </Link>
      <nav aria-label="주요 메뉴" className="flex items-center gap-4">
        <Link
          href="/products"
          className="text-sm text-(--color-text) hover:text-(--color-ink)"
        >
          상품
        </Link>
        <span
          className="text-sm text-(--color-muted)"
          aria-label={`위시리스트 ${String(wishlistCount)}개`}
        >
          위시리스트 {wishlistCount}
        </span>
        <span
          className="text-sm text-(--color-muted)"
          aria-label={`장바구니 ${String(cartCount)}개`}
        >
          장바구니 {cartCount}
        </span>
      </nav>
    </header>
  )
}
