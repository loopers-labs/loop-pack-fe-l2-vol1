'use client';

import { useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { LogoutButton } from '@/features/auth';
import Link from 'next/link';

interface HeaderProps {
  isLoggedIn?: boolean;
}

/**
 * 공통 헤더. 장바구니·위시리스트 "개수"만 selector로 구독한다.
 * 개수는 store에 저장하지 않고 배열 길이에서 파생한다.
 * 상품 담김 여부는 여기서 구독하지 않으므로, 개별 상품 토글은 헤더를 리렌더하지 않는다.
 *
 * 장바구니 개수는 주문서로 가는 링크다. 주문서가 곧 담긴 목록을 보여주는 화면이라 따로 둘
 * 장바구니 화면이 없다. 대가가 하나 있다 — /order 는 보호 경로라 **담아둔 것을 보기만 하려 해도
 * 로그인해야 한다.** 담기 자체는 비로그인에서도 되지만 확인은 안 되는 셈이다. 로그인 화면으로
 * 튕겨도 returnTo 로 돌아오므로 담은 것이 사라지지는 않는다.
 *
 * 위시리스트는 링크가 아니다. 그 목록을 보여주는 화면이 아직 없다.
 *
 * isLoggedIn 은 서버 레이아웃이 세션 쿠키 존재 여부로 판독해 내려준다.
 * SSR HTML 에 이미 반영되므로 JavaScript 실행 전에도 로그인 상태가 보인다.
 * 단, 이 단계에서 쿠키 서명을 검증하지 않으므로 만료된 세션도 로그인으로 표시된다.
 * 실제 만료는 클라이언트 401 인터셉터가 감지해 /login?reason=expired 로 보낸다.
 */
export function Header({ isLoggedIn = false }: HeaderProps) {
  const wishList = useWishlistStore((state) => state.wishlist);
  const cart = useCartStore((state) => state.cart);

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishList.length}</span>
        <Link href="/order">장바구니 {cart.length}</Link>
        {isLoggedIn ? (
          <>
            <Link href="/mypage">마이페이지</Link>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
      </nav>
    </header>
  );
}
