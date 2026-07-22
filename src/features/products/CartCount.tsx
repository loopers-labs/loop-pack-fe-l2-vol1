'use client';

import { useBoundStore } from '@/shared/store';

export function CartCount() {
  const count = useBoundStore((state) => state.cartProductIds.length);

  return <span>장바구니 {count}</span>;
}
