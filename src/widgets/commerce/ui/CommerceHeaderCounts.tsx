"use client";

import Link from "next/link";
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

  // role="status" 로 개수 변화를 스크린리더가 알리게 한다(라이브 리전). status 는 콘텐츠에서
  // 이름을 가져오지 않으므로, aria-label 로 "장바구니 N" 을 이름으로 줘 SR·테스트가 role·이름으로 짚게 한다.
  return (
    <div className={styles.headerCounts}>
      <Link href="/cart" className={styles.cartLink}>
        <span role="status" aria-label={`장바구니 ${cart}`}>
          장바구니 {cart}
        </span>
      </Link>
      <span role="status" aria-label={`위시리스트 ${wishlist}`}>
        위시리스트 {wishlist}
      </span>
    </div>
  );
}
