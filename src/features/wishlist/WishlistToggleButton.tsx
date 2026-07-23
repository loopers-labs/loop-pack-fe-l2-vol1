'use client';

import { useBoundStore } from '@/shared/store';

export function WishlistToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isWishlisted = useBoundStore((state) =>
    state.wishlistProductIds.includes(productId),
  );
  const toggleWishlist = useBoundStore((state) => state.toggleWishlist);

  return (
    <button
      type="button"
      aria-label={`${productName} 찜`}
      aria-pressed={isWishlisted}
      onClick={() => {
        toggleWishlist(productId);
      }}
    >
      찜
    </button>
  );
}
