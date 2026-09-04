'use client';

import { useIsInCart, useToggleCart } from '@/entities/cart';
import { analyticsEvents } from '@/shared/analytics/events';

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
      onClick={() => {
        // 담기만 계측한다 — 시드 스키마에 cart_remove가 없다 (RFC A절).
        if (!inCart) analyticsEvents.cartAdd(productId);
        toggleCart(productId);
      }}
    >
      {inCart ? '빼기' : '담기'}
    </button>
  );
}
