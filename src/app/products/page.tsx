import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import { productQueries } from '@/entities/product';
import { CartCount } from '@/features/cart/CartCount';
import {
  ProductListFilters,
  ProductSearchForm,
  toProductListQuery,
} from '@/features/product';
import { loadProductListConditions } from '@/features/product/index.server';
import { ProductList } from '@/features/products/ProductList';
import { WishlistCount } from '@/features/wishlist/WishlistCount';
import { getQueryClient } from '@/shared/get-query-client';

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
          <ProductListContent searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

/**
 * 목록 대기 화면을 먼저 보내고, 조회가 끝나면 완성된 목록 HTML을 이어서 보낸다.
 * searchParams가 요청 시점 값이라 Next.js가 이 페이지를 알아서 동적으로 렌더한다.
 */
async function ProductListContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const conditions = await loadProductListConditions(searchParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    productQueries.list(toProductListQuery(conditions)),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductList />
    </HydrationBoundary>
  );
}
