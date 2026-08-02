"use client";

import { useWishlistStore } from "../model/store";

export type WishlistToggleButtonProps = {
  productId: string;
  productName: string;
};

export function WishlistToggleButton({ productId, productName }: WishlistToggleButtonProps) {
  const inWishlist = useWishlistStore((state) => state.wishlistIds.has(productId));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  return (
    <button
      type="button"
      aria-pressed={inWishlist}
      aria-label={`${productName} 위시리스트`}
      onClick={() => toggleWishlist(productId)}
    >
      찜
    </button>
  );
}
