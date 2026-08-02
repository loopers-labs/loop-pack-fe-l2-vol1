"use client";

import Link from "next/link";
import { useCommerceStore } from "./store";
import styles from "./commerce.module.css";

export function Header() {
  const cartCount = useCommerceStore((s) => s.cartIds.size);
  const wishlistCount = useCommerceStore((s) => s.wishlistIds.size);

  return (
    <header className={styles.header}>
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <Link href="/week-04">4주차</Link>
        <span>{`위시리스트 ${wishlistCount}`}</span>
        <span>{`장바구니 ${cartCount}`}</span>
      </nav>
    </header>
  );
}
