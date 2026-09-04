'use client';

import { useWishlistStore } from '@/entities/wishlist';
import { trackWishlistAdd, trackWishlistRemove } from '@/analytics/events';

interface WishlistToggleButtonProps {
  productId: string;
  productLabel: string;
}

export default function WishlistToggleButton({ productId, productLabel }: WishlistToggleButtonProps) {
  const isInWishlist = useWishlistStore((state) => state.ids.has(productId));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  function handleClick() {
    if (isInWishlist) {
      trackWishlistRemove(productId);
    } else {
      trackWishlistAdd(productId);
    }
    toggleWishlist(productId);
  }

  return (
    <button type="button" aria-label={`${productLabel} 위시리스트`} aria-pressed={isInWishlist} onClick={handleClick}>
      찜
    </button>
  );
}
