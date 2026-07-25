"use client";

import { useCommerceStore } from "./store";
import styles from "./commerce.module.css";

export interface ProductActionsProps {
  productId: string;
  productName: string;
}

export function ProductActions({ productId, productName }: ProductActionsProps) {
  const inCart = useCommerceStore((state) => state.cartIds.has(productId));
  const inWishlist = useCommerceStore((state) => state.wishlistIds.has(productId));
  const toggleCart = useCommerceStore((state) => state.toggleCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);

  return (
    <div className={styles.actions}>
      <button
        type="button"
        aria-pressed={inCart}
        aria-label={`${productName} 장바구니`}
        onClick={() => toggleCart(productId)}
      >
        담기
      </button>
      <button
        type="button"
        aria-pressed={inWishlist}
        aria-label={`${productName} 위시리스트`}
        onClick={() => toggleWishlist(productId)}
      >
        찜
      </button>
    </div>
  );
}
