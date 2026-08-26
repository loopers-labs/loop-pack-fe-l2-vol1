'use client';

import Link from 'next/link';
import { useWishlistCount } from '@/features/toggle-wishlist/model/store';
import { useCartCount } from '@/features/add-to-cart/model/store';
import styles from './Header.module.css';

export const Header = () => {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  return (
    <header className={styles.header}>
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
};
