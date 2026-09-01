'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/entities/cart/model/cartStore';
import { useWishlistStore } from '@/entities/wishlist/model/wishlistStore';
import { sessionQueries } from '@/entities/session/api/sessionQueries';

export function Header() {
  const cartCount = useCartStore((state) => state.items.length);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { data: user } = useQuery(sessionQueries.me());

  return (
    <header className="week05-header">
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
        {user ? <span>{user.name}님</span> : <Link href="/login">로그인</Link>}
      </nav>
    </header>
  );
}
