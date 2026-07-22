import Link from 'next/link';

import { CartCount } from '@/features/products/CartCount';
import { HomeContent } from '@/features/products/HomeContent';
import { WishlistCount } from '@/features/products/WishlistCount';

export default function HomePage() {
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

      <HomeContent />
    </main>
  );
}
