'use client';

import { useBoundStore, useSavedStore } from '@/shared/store';

export function CartToggleButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const isInCart = useSavedStore((state) =>
    state.cartProductIds.includes(productId),
  );
  const toggleCart = useBoundStore((state) => state.toggleCart);

  // 복원 직전에 누른 클릭은 뒤이은 복원값에 덮이므로, 아직 모르는 동안은 잠근다
  return (
    <button
      type="button"
      aria-label={`${productName} 담기`}
      aria-pressed={isInCart}
      disabled={isInCart === undefined}
      onClick={() => {
        toggleCart(productId);
      }}
    >
      담기
    </button>
  );
}
