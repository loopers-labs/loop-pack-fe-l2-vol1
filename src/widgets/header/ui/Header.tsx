"use client";
import Link from "next/link";
import { useCartCount } from "@/entities/cart";
import { useWishlistCount } from "@/entities/wishlist";

// 헤더는 "개수"만 구독한다 — 어떤 상품이 담겼는지는 알 필요가 없다.
// 두 entity를 조합해 보여주는 독립 블록이라 widget이다.
export function Header() {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  return (
    <header className="shop-header">
      <Link href="/" className="shop-logo">
        Commerce
      </Link>
      <nav className="shop-nav" aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span aria-label={`위시리스트 ${wishlistCount}개`}>위시리스트 {wishlistCount}</span>
        <span aria-label={`장바구니 ${cartCount}개`}>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
}
