'use client';

import { useBoundStore } from '@/shared/store';

export function WishlistCount() {
  const count = useBoundStore((state) => state.wishlistProductIds.length);

  return <span>위시리스트 {count}</span>;
}
