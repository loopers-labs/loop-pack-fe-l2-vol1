'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';

export function HeaderNav() {
  const queryClient = useQueryClient();
  const cartCount = useCartStore((s) => s.items.size);
  const wishlistCount = useWishlistStore((s) => s.ids.size);

  const prefetchProducts = useCallback(() => {
    void queryClient.prefetchQuery(
      productListQueryOptions({ category: 'all', sort: 'latest', page: 1 }),
    );
  }, [queryClient]);

  return (
    <nav className="hidden gap-8 text-[14px] font-medium text-text-secondary sm:flex">
      <Link
        href="/products"
        className="transition-colors hover:text-text"
        onMouseEnter={prefetchProducts}
      >
        상품
      </Link>
      <span className="text-text-caption">위시리스트 {wishlistCount}</span>
      <span className="text-text-caption">장바구니 {cartCount}</span>
    </nav>
  );
}
