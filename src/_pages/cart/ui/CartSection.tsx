"use client";

import Link from "next/link";
import { useCartCount, useCartHasHydrated } from "@/entities/cart";
import { CartLineList } from "@/widgets/cart";
import styles from "./CartSection.module.css";

// 장바구니 화면 — 담긴 상품을 보여주고 주문서(/orders/new)로 넘긴다. 실제 주문 생성은 주문서에서.
export function CartSection() {
  const count = useCartCount();
  const hasHydrated = useCartHasHydrated();
  const canOrder = hasHydrated && count > 0;

  return (
    <div className={styles.cart}>
      <CartLineList />
      {canOrder ? (
        <Link href="/orders/new" className={styles.orderLink}>
          주문하기
        </Link>
      ) : (
        <button type="button" className={styles.orderLink} disabled>
          주문하기
        </button>
      )}
    </div>
  );
}
