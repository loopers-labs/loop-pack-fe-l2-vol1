'use client';

import Link from 'next/link';
import { useCartCount } from '@/entities/cart';
import { useWishCount } from '@/entities/wishlist';

export function SiteHeader() {
  const cartCount = useCartCount();
  const wishCount = useWishCount();

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
}
