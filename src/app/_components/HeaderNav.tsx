'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export function HeaderNav() {
  const cartCount = useCartStore((s) => {
    let total = 0;
    for (const item of s.items.values()) total += item.quantity;
    return total;
  });
  const wishlistCount = useWishlistStore((s) => s.ids.size);

  return (
    <nav className="hidden gap-8 text-[14px] font-medium text-text-secondary sm:flex">
      <Link href="/products" className="transition-colors hover:text-text">
        상품
      </Link>
      <span className="text-text-caption">위시리스트 {wishlistCount}</span>
      <span className="text-text-caption">장바구니 {cartCount}</span>
    </nav>
  );
}
