'use client';

import { useWishlistStore } from '@/entities/wishlist';
import { trackWishlistAdd } from '@/shared/lib/analytics/events';

/**
 * 찜 토글과 그 계측. 근거는 useAddToCart 와 같다.
 *
 * 찜 해제는 계측하지 않는다. 시드 로그에 wishlist_remove 가 없다.
 */
export function useToggleWishlist(productId: string) {
  const wishlist = useWishlistStore((state) => state.wishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const isWished = wishlist.includes(productId);

  const toggle = () => {
    toggleWishlist(productId);

    if (!isWished) {
      trackWishlistAdd(productId);
    }
  };

  return { isWished, toggle };
}
