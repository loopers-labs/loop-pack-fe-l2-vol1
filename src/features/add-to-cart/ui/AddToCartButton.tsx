"use client";

import { useIsInCart, useToggleCart } from "@/entities/cart";

export function AddToCartButton({ productId }: { productId: string }) {
  const isInCart = useIsInCart(productId);
  const toggleCart = useToggleCart();

  return (
    <button
      type="button"
      aria-pressed={isInCart}
      aria-label="장바구니"
      onClick={() => toggleCart(productId)}
    >
      {isInCart ? "담김" : "담기"}
    </button>
  );
}
