'use client';

import { trackCartAdd } from '@/analytics/events';
import { useCartStore } from '@/entities/cart/model/useCartStore';

export function useAddToCart(productId: string): () => void {
  const addItem = useCartStore((state) => state.addItem);

  return () => {
    addItem(productId);
    trackCartAdd(productId);
  };
}
