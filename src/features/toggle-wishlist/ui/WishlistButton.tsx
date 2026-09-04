"use client";

import { trackEvent } from "@/analytics/schema";
import { useIsWishlisted, useToggleWishlist } from "@/entities/wishlist";

interface WishlistButtonProps {
  productId: string;
  productName: string;
}

// 찜 토글 행위. 자기 상품의 찜 여부만 구독해 다른 상품 변화에는 리렌더되지 않는다.
export function WishlistButton({ productId, productName }: WishlistButtonProps) {
  const isWishlisted = useIsWishlisted(productId);
  const toggleWishlist = useToggleWishlist();

  // 찜을 추가할 때만 wishlist_add를 찍는다. 해제에 대응하는 이벤트는 시드 스키마에 없다.
  function handleClick() {
    if (!isWishlisted) {
      trackEvent("wishlist_add", { productId });
    }
    toggleWishlist(productId);
  }

  return (
    <button
      type="button"
      className="week05-wish"
      aria-label={`${productName} 위시리스트`}
      aria-pressed={isWishlisted}
      onClick={handleClick}
    >
      {/* 상태는 aria-pressed가 전하므로 아이콘은 장식이다. 채움은 CSS가 그 속성으로 제어한다. */}
      <svg className="week05-wish-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
