"use client";
import { useIsInCart, useToggleCart } from "@/entities/cart";
import { EVENT, trackEvent } from "@/shared/analytics";

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
      onClick={() => {
        // 담기는 사용자 액션의 부수효과다 — effect가 아니라 여기서 보낸다.
        // 토글이라 해제도 이 핸들러를 지나가는데, 해제는 cart_add가 아니다.
        // 상태를 바꾼 뒤의 값이 아니라 **바꾸기 전의 값**으로 방향을 판단한다.
        if (!inCart) {
          // 수량 선택 UI가 없다. 시드 로그의 quantity도 전부 1이다.
          trackEvent(EVENT.cartAdd, { productId, quantity: 1 });
        }
        toggleCart(productId);
      }}
    >
      {inCart ? "담김" : "담기"}
    </button>
  );
}
