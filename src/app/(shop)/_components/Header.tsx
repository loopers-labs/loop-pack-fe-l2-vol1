'use client';

import Link from 'next/link';

import { useCommerceStore } from '@/store/useCommerceStore';

/**
 * 공통 헤더. 장바구니·위시리스트 "개수"만 selector로 구독한다.
 * 개수는 store에 저장하지 않고 배열 길이에서 파생한다.
 * 상품 담김 여부는 여기서 구독하지 않으므로, 개별 상품 토글은 헤더를 리렌더하지 않는다.
 */
export function Header() {
  const wishList = useCommerceStore((state) => state.wishlist);
  const cart = useCommerceStore((state) => state.cart);

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishList.length}</span>
        <span>장바구니 {cart.length}</span>
      </nav>
    </header>
  );
}
