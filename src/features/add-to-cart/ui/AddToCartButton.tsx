"use client";

import { trackEvent } from "@/analytics/schema";
import { useAddToCart, useIsInCart, useRemoveFromCart } from "@/entities/cart";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
}

// 담기·빼기 토글 행위. 담겼으면 빼고, 아니면 담는다. 자기 상품의 포함 여부만 구독한다.
export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const isInCart = useIsInCart(productId);
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();

  // 담을 때만 cart_add를 찍는다. 빼기에 대응하는 이벤트는 시드 스키마에 없다.
  function handleClick() {
    if (isInCart) {
      removeFromCart(productId);
      return;
    }
    trackEvent("cart_add", { productId });
    addToCart(productId);
  }

  return (
    <button
      type="button"
      className="week05-cart"
      aria-label={`${productName} 장바구니`}
      aria-pressed={isInCart}
      onClick={handleClick}
    >
      담기
    </button>
  );
}
