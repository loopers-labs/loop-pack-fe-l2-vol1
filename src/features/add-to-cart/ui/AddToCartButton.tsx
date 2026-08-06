'use client';

import { useIsInCart, useToggleCart } from '@/entities/cart';

export function AddToCartButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const inCart = useIsInCart(productId);
  const toggleCart = useToggleCart();

  return (
    <button
      type="button"
      aria-pressed={inCart}
      aria-label={`${productName} 장바구니`}
      onClick={() => toggleCart(productId)}
    >
      {inCart ? '빼기' : '담기'}
    </button>
  );
}
