"use client";

import { useCartCount, useCartHasHydrated } from "@/entities/cart";
import { useWishlistCount, useWishlistHasHydrated } from "@/entities/wishlist";
import styles from "./CommerceHeaderCounts.module.css";

const PENDING_COUNT = "–";

export function CommerceHeaderCounts() {
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  // 각 store 는 독립 복원이라 각자의 hasHydrated 로 placeholder/실제값을 가른다.
  const cart = useCartHasHydrated() ? cartCount : PENDING_COUNT;
  const wishlist = useWishlistHasHydrated() ? wishlistCount : PENDING_COUNT;

  return (
    <div className={styles.headerCounts}>
      <span>
        장바구니 <span data-testid="cart-count">{cart}</span>
      </span>
      <span>
        위시리스트 <span data-testid="wishlist-count">{wishlist}</span>
      </span>
    </div>
  );
}
