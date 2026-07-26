'use client';

import { useBoundStore, useSavedStore } from '@/shared/store';

export function WishlistToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isWishlisted = useSavedStore((state) =>
    state.wishlistProductIds.includes(productId),
  );
  const toggleWishlist = useBoundStore((state) => state.toggleWishlist);

  // 복원 직전에 누른 클릭은 뒤이은 복원값에 덮이므로, 아직 모르는 동안은 잠근다
  return (
    <button
      type="button"
      aria-label={`${productName} 찜`}
      aria-pressed={isWishlisted}
      disabled={isWishlisted === undefined}
      onClick={() => {
        toggleWishlist(productId);
      }}
    >
      찜
    </button>
  );
}
