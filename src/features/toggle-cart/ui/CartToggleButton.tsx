'use client';

import { useCartStore } from '@/entities/cart';
import { trackCartAdd, trackCartRemove } from '@/analytics/events';

interface CartToggleButtonProps {
  productId: string;
  productLabel: string;
}

export default function CartToggleButton({ productId, productLabel }: CartToggleButtonProps) {
  const isInCart = useCartStore((state) => state.items.has(productId));
  const toggleCart = useCartStore((state) => state.toggle);

  function handleClick() {
    if (isInCart) {
      trackCartRemove(productId);
    } else {
      trackCartAdd(productId);
    }
    toggleCart(productId);
  }

  return (
    <button type="button" aria-label={`${productLabel} 장바구니`} aria-pressed={isInCart} onClick={handleClick}>
      담기
    </button>
  );
}
