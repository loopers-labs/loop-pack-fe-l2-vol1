"use client";
import { useIsInCart, useToggleCart } from "@/entities/cart";

// 행위에 필요한 건 id뿐이다. Product 전체를 받으면 이 feature가 상품 스키마 변경에 묶인다.
// productName은 aria-label 문구용으로만 받는다.
export function AddToCartButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  // 이 상품의 포함 여부 + 토글 action만 구독한다 — 다른 상품이 담겨도 리렌더되지 않는다.
  const inCart = useIsInCart(productId);
  const toggleCart = useToggleCart();

  return (
    <button
      type="button"
      aria-label={`${productName} 장바구니`}
      aria-pressed={inCart}
      onClick={() => toggleCart(productId)}
    >
      {inCart ? "담김" : "담기"}
    </button>
  );
}
