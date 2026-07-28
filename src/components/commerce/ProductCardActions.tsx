"use client";

import { useCommerceStore } from "@/stores/commerceStore";
import styles from "./commerce.module.css";

// 해당 상품의 포함 여부와 토글 action 만 selector 로 구독한다 — store 전체를 구독하지 않아,
// 다른 상품·다른 목록(장바구니↔위시리스트)의 변경으로는 리렌더되지 않는다.
export function ProductCardActions({ productId }: { productId: string }) {
  const isInCart = useCommerceStore((state) => state.cartIds.has(productId));
  const isInWishlist = useCommerceStore((state) =>
    state.wishlistIds.has(productId),
  );
  const toggleCart = useCommerceStore((state) => state.toggleCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);

  return (
    <div className={styles.cardActions}>
      <button
        type="button"
        aria-pressed={isInCart}
        aria-label="장바구니"
        onClick={() => toggleCart(productId)}
      >
        {isInCart ? "담김" : "담기"}
      </button>
      <button
        type="button"
        aria-pressed={isInWishlist}
        aria-label="위시리스트"
        onClick={() => toggleWishlist(productId)}
      >
        {isInWishlist ? "♥" : "♡"}
      </button>
    </div>
  );
}
