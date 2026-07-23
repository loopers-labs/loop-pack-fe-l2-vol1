'use client';

import Link from 'next/link';
import { useWishlistCount } from '@/features/store-product/store/wishlist';
import { useCartCount } from '@/features/store-product/store/cart';
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
