'use client';

import { useBoundStore } from '@/shared/store';

export function CartToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isInCart = useBoundStore((state) =>
    state.cartProductIds.includes(productId),
  );
  const toggleCart = useBoundStore((state) => state.toggleCart);

  return (
    <button
      type="button"
      aria-label={`${productName} 담기`}
      aria-pressed={isInCart}
      onClick={() => {
        toggleCart(productId);
      }}
    >
      담기
    </button>
  );
}
