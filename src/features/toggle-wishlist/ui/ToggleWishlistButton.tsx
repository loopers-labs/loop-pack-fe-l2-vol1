'use client';

import { useToggleWishlist } from '../model/useToggleWishlist';

type ToggleWishlistButtonProps = {
  /** 토글 대상 상품 id */
  productId: string;
  /** aria-label 조합 기준 문자열 (예: "인기 상품 1번 상품") */
  label: string;
};

/* AI-generated : week06-fsd.md 기준으로 설계 및 검토 완료 */
export function ToggleWishlistButton({ productId, label }: ToggleWishlistButtonProps) {
  const { isWished, toggle } = useToggleWishlist(productId);

  return (
    <button
      type="button"
      className={isWished ? 'toggled' : ''}
      aria-label={`${label} 위시리스트`}
      aria-pressed={isWished}
      onClick={toggle}
    >
      찜
    </button>
  );
}
