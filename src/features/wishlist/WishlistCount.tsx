'use client';

import { useSavedStore } from '@/shared/store';

export function WishlistCount() {
  const count = useSavedStore((state) => state.wishlistProductIds.length);

  // 복원 전에는 담아둔 게 있어도 0으로 보이므로, 숫자 자리를 비워두고 폭만 남긴다
  return (
    <span>
      위시리스트 <span className="week05-count">{count}</span>
    </span>
  );
}
