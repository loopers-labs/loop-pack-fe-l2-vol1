"use client";

import { useCartStore } from "../model/store";

export type AddToCartButtonProps = {
  productId: string;
  productName: string;
};

export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const inCart = useCartStore((state) => state.cartIds.has(productId));
  const toggleCart = useCartStore((state) => state.toggleCart);

  return (
    <button
      type="button"
      aria-pressed={inCart}
      aria-label={`${productName} 장바구니`}
      onClick={() => toggleCart(productId)}
    >
      담기
    </button>
  );
}
