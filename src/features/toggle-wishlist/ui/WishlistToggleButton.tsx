'use client';

import { useWishlistStore } from '@/entities/wishlist';

/**
 * 상품을 위시리스트에 넣고 빼는 버튼.
 *
 * wishlist 엔티티만 안다. 장바구니 feature 와는 서로를 모르며,
 * 둘을 나란히 보여줘야 한다면 상위(page/widget)에서 조합한다.
 * 찜 여부는 저장하지 않고 목록에서 파생한다.
 */
type WishlistToggleButtonProps = {
  productId: string;
  productName: string;
};

export function WishlistToggleButton({ productId, productName }: WishlistToggleButtonProps) {
  const wishList = useWishlistStore((state) => state.wishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const isWished = wishList.includes(productId);

  return (
    <button
      type="button"
      aria-label={`${productName} 위시리스트`}
      aria-pressed={isWished}
      onClick={() => toggleWishlist(productId)}
    >
      {isWished ? '찜 해제' : '찜'}
    </button>
  );
}
