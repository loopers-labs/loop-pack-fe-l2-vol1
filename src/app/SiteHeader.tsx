'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCartCount } from '@/entities/cart';
import { sessionQueries } from '@/entities/session';
import { useWishCount } from '@/entities/wishlist';
import { LogoutButton } from '@/features/logout/ui/LogoutButton';

export function SiteHeader() {
  const cartCount = useCartCount();
  const wishCount = useWishCount();
  // 서버가 (commerce) 레이아웃에서 쿠키를 읽어 이 키를 미리 채운다 — 초기 HTML에 로그인 상태가 있다.
  const { data: user } = useQuery(sessionQueries.me());

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishCount}</span>
        <span>장바구니 {cartCount}</span>
        {user ? (
          <>
            <Link href="/orders">주문 내역</Link>
            <span>{user.name}님</span>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
      </nav>
    </header>
  );
}
