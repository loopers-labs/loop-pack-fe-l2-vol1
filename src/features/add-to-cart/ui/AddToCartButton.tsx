'use client';

import { useCartStore } from '@/entities/cart/model/useCartStore';

type AddToCartButtonProps = {
  /** 토글 대상 상품 id */
  productId: string;
  /** aria-label 조합 기준 문자열 (예: "인기 상품 1번 상품") */
  label: string;
};

/* AI-generated : week06-fsd.md 기준으로 설계 및 검토 완료 */
export function AddToCartButton({ productId, label }: AddToCartButtonProps) {
  const isInCart = useCartStore((state) => state.productIds.has(productId));
  const toggleCart = useCartStore((state) => state.setSingleIdInCart);

  return (
    <button
      type="button"
      className={isInCart ? 'toggled' : ''}
      aria-label={`${label} 담기`}
      aria-pressed={isInCart}
      onClick={() => toggleCart(productId)}
    >
      담기
    </button>
  );
}
