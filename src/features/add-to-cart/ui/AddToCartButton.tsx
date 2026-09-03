"use client";

import { useIsInCart, useToggleCart } from "@/entities/cart";
import { trackCartAdd } from "../model/analytics";

export function AddToCartButton({ productId }: { productId: string }) {
  const isInCart = useIsInCart(productId);
  const toggleCart = useToggleCart();

  // 토글은 담기·빼기 둘 다다. 담기(빈 → 담김)일 때만 계측한다.
  const handleToggle = () => {
    const willAdd = !isInCart;
    toggleCart(productId);

    if (willAdd) trackCartAdd(productId);
  };

  return (
    <button
      type="button"
      aria-pressed={isInCart}
      aria-label="장바구니"
      onClick={handleToggle}
    >
      {isInCart ? "담김" : "담기"}
    </button>
  );
}
