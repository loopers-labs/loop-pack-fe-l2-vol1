"use client";

import { useIsWishlisted, useToggleWishlist } from "@/entities/wishlist";

export function WishlistButton({ productId }: { productId: string }) {
  const isInWishlist = useIsWishlisted(productId);
  const toggleWishlist = useToggleWishlist();

  return (
    <button
      type="button"
      aria-pressed={isInWishlist}
      aria-label="위시리스트"
      onClick={() => toggleWishlist(productId)}
    >
      {isInWishlist ? "♥" : "♡"}
    </button>
  );
}
