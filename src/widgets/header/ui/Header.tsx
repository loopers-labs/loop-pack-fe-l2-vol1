"use client";

import Link from "next/link";

import { useCartCount, useCartHydrated } from "@/entities/cart";
import { useSession } from "@/entities/session/ui/SessionProvider";
import { useWishlistCount, useWishlistHydrated } from "@/entities/wishlist";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { Skeleton } from "@/shared/ui/loading/Skeleton";

import styles from "./Header.module.css";

// 두 화면이 공유하는 헤더. 위시리스트·장바구니 개수를 store에서 파생해 읽는다.
// 각 count는 원자적 selector라 한쪽만 바뀌면 다른 span은 리렌더되지 않는다.
export function Header() {
  const cartHydrated = useCartHydrated();
  const wishlistHydrated = useWishlistHydrated();
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();
  const { user, isLoggedIn } = useSession();

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        {/* 복원 전에는 잘못된 0 대신 로딩을 보여, 새로고침 때 복원된 값으로 바로 이어지게 한다. */}
        {wishlistHydrated ? (
          <span>위시리스트 {wishlistCount}</span>
        ) : (
          <Skeleton className="inline-block h-5 w-20 rounded align-middle" />
        )}
        {cartHydrated ? (
          <Link href="/cart">장바구니 {cartCount}</Link>
        ) : (
          <Skeleton className="inline-block h-5 w-20 rounded align-middle" />
        )}
        {/* 로그인 상태는 서버가 SessionProvider로 내린 값이라 하이드레이션 없이 바로 렌더된다(스켈레톤 불필요). */}
        {isLoggedIn ? (
          <>
            <Link href="/orders">주문 내역</Link>
            <span>{user?.name}</span>
            <LogoutButton className={`${styles.authButton} ${styles.logout}`} />
          </>
        ) : (
          <Link href="/login" className={`${styles.authButton} ${styles.login}`}>
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
