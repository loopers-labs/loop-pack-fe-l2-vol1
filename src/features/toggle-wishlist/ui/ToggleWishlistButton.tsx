"use client";
import { EVENT, trackEvent } from "@/shared/analytics";
import { useIsInWishlist, useToggleWishlist } from "@/entities/wishlist";

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
      onClick={() => {
        // 담기 방향만 보낸다. 근거는 AddToCartButton에 적었다.
        if (!inWishlist) {
          trackEvent(EVENT.wishlistAdd, { productId });
        }
        toggleWishlist(productId);
      }}
    >
      {inWishlist ? "찜 해제" : "찜"}
    </button>
  );
}
