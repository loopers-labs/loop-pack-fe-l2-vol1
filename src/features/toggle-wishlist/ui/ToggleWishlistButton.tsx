"use client";
import { useIsInWishlist, useToggleWishlist } from "@/entities/wishlist/model/store";

export function ToggleWishlistButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const inWishlist = useIsInWishlist(productId);
  const toggleWishlist = useToggleWishlist();

  return (
    <button
      type="button"
      aria-label={`${productName} 위시리스트`}
      aria-pressed={inWishlist}
      onClick={() => toggleWishlist(productId)}
    >
      {inWishlist ? "찜 해제" : "찜"}
    </button>
  );
}
