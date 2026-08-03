'use client';

import { useCartStore } from '@/entities/cart';

/**
 * 상품을 장바구니에 담고 빼는 버튼.
 *
 * cart 엔티티만 안다. 위시리스트 feature 와는 서로를 모르며,
 * 둘을 나란히 보여줘야 한다면 상위(page/widget)에서 조합한다.
 * 담김 여부는 저장하지 않고 목록에서 파생한다.
 */
type AddToCartButtonProps = {
  productId: string;
  productName: string;
};

export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const cart = useCartStore((state) => state.cart);
  const toggleCart = useCartStore((state) => state.toggleCart);

  const isInCart = cart.includes(productId);

  return (
    <button
      type="button"
      aria-label={`${productName} 장바구니`}
      aria-pressed={isInCart}
      onClick={() => toggleCart(productId)}
    >
      {isInCart ? '담김' : '담기'}
    </button>
  );
}
