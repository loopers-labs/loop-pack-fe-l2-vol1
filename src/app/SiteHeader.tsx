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
        {/* 주문서는 client navigation으로 가야 메모리 카트가 살아 있다. 보호 경로는 prefetch하지 않는다 —
            로그인 상태에 따라 답이 달라지는 경로를 미리 받아두면 proxy의 리다이렉트가 라우터 캐시에
            남아 로그인 후에도 로그인 화면으로 되돌아온다(5단계 실험 7로 확인) */}
        <Link href="/checkout" prefetch={false}>
          주문서
        </Link>
        {user ? (
          <>
            <Link href="/orders" prefetch={false}>
              주문 내역
            </Link>
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
