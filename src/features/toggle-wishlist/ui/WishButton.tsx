'use client';

import { useIsWished, useToggleWish } from '@/entities/wishlist';

export function WishButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const wished = useIsWished(productId);
  const toggleWish = useToggleWish();

  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={`${productName} 위시리스트`}
      onClick={() => toggleWish(productId)}
    >
      {wished ? '♥ 찜' : '♡ 찜'}
    </button>
  );
}
