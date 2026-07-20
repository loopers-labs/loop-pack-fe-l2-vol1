"use client";

import Link from "next/link";
import { useCommerceStore } from "@/stores/commerce/store";

export function CommerceHeader() {
  const hasHydrated = useCommerceStore((state) => state.hasHydrated);
  const wishlistCount = useCommerceStore((state) => state.wishlistProductIds.length);
  const cartCount = useCommerceStore((state) => state.cartProductIds.length);
  const visibleWishlistCount = hasHydrated ? wishlistCount : 0;
  const visibleCartCount = hasHydrated ? cartCount : 0;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-6 max-[480px]:items-start">
      <Link href="/">Commerce</Link>
      <nav className="flex flex-wrap items-center gap-3 max-[480px]:w-full" aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {visibleWishlistCount}</span>
        <span>장바구니 {visibleCartCount}</span>
      </nav>
    </header>
  );
}
