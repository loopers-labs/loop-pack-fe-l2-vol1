"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCartCount } from "@/entities/cart";
import { sessionQueryOptions } from "@/entities/session";
import { useWishlistCount } from "@/entities/wishlist";
import { useLogout } from "@/features/auth";

// 헤더는 "개수"만 구독한다 — 어떤 상품이 담겼는지는 알 필요가 없다.
// 두 entity를 조합해 보여주는 독립 블록이라 widget이다.
export function Header() {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();
  // (shop) layout이 서버에서 넣어둔 값을 그대로 읽는다. 그래서 초기 HTML에도
  // 로그인 상태가 들어 있고, JS가 실행되기 전에 보인다.
  const { data: session } = useQuery(sessionQueryOptions());
  const logout = useLogout();

  return (
    <header className="shop-header">
      <Link href="/" className="shop-logo">
        Commerce
      </Link>
      <nav className="shop-nav" aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span aria-label={`위시리스트 ${wishlistCount}개`}>위시리스트 {wishlistCount}</span>
        <span aria-label={`장바구니 ${cartCount}개`}>장바구니 {cartCount}</span>
        {session?.status === "authenticated" ? (
          <>
            <Link href="/orders">주문 내역</Link>
            <span aria-label={`로그인 계정 ${session.user.name}`}>{session.user.name}</span>
            <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
              로그아웃
            </button>
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
      </nav>
    </header>
  );
}
