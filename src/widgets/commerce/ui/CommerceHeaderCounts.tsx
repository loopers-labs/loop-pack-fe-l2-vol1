"use client";

import { useCartCount, useCartHasHydrated } from "@/entities/cart";
import styles from "./CommerceHeaderCounts.module.css";

const PENDING_COUNT = "–";

export function CommerceHeaderCounts() {
  const cartCount = useCartCount();

  // 복원 전엔 실제 개수 대신 placeholder 를 보인다(hasHydrated 로 가른다).
  const cart = useCartHasHydrated() ? cartCount : PENDING_COUNT;

  return (
    <div className={styles.headerCounts}>
      <span>
        장바구니 <span data-testid="cart-count">{cart}</span>
      </span>
    </div>
  );
}
