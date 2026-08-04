import Link from 'next/link';
import type { ReactNode } from 'react';

import { CartCount } from '@/entities/cart';
import { WishlistCount } from '@/entities/wishlist';

export default function CommerceLayout({ children }: { children: ReactNode }) {
  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <div className="week05-header-actions">
          <nav aria-label="주요 메뉴">
            <Link href="/products">상품</Link>
          </nav>
          <WishlistCount />
          <CartCount />
        </div>
      </header>
      {children}
    </main>
  );
}
