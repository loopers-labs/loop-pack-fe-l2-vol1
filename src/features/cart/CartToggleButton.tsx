'use client';

import { useCart } from '@/entities/client-state';

export function CartToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isInCart = useCart((cart) => cart.isIn(productId));
  const toggle = useCart((cart) => cart.toggle);

  // 복원 직전에 누른 클릭은 뒤이은 복원값에 덮이므로, 아직 모르는 동안은 잠근다
  return (
    <button
      type="button"
      aria-label={`${productName} 담기`}
      aria-pressed={isInCart}
      disabled={isInCart === undefined}
      onClick={() => {
        toggle(productId);
      }}
    >
      담기
    </button>
  );
}
