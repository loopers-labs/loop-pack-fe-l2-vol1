import Link from 'next/link';
import { Suspense } from 'react';

import { CartCount } from '@/features/products/CartCount';
import { ProductList } from '@/features/products/ProductList';
import { ProductListFilters } from '@/features/products/ProductListFilters';
import { ProductSearchForm } from '@/features/products/ProductSearchForm';
import { WishlistCount } from '@/features/products/WishlistCount';

export default function ProductsPage() {
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

      <section className="week05-section">
        <h1>상품 목록</h1>

        <Suspense>
          <ProductSearchForm />
          <ProductListFilters />
        </Suspense>
      </section>

      <section className="week05-section" aria-label="상품 검색 결과">
        <Suspense
          fallback={
            <p className="week05-status" role="status">
              상품 목록을 불러오는 중입니다…
            </p>
          }
        >
          <ProductList />
        </Suspense>
      </section>
    </main>
  );
}
