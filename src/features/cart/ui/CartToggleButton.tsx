'use client';

import { trackEvent } from '@/analytics/events';
import { useCart, useCartActions } from '@/entities/cart';

export function CartToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isInCart = useCart((cart) =>
    cart.items.some((item) => item.productId === productId),
  );
  const { toggle } = useCartActions();

  // 복원 직전에 누른 클릭은 뒤이은 복원값에 덮이므로, 아직 모르는 동안은 잠근다
  return (
    <button
      type="button"
      aria-label={`${productName} 담기`}
      aria-pressed={isInCart}
      disabled={isInCart === undefined}
      onClick={() => {
        if (isInCart === false) {
          trackEvent('cart_add', { productId, quantity: 1 });
        }
        toggle(productId);
      }}
    >
      담기
    </button>
  );
}
