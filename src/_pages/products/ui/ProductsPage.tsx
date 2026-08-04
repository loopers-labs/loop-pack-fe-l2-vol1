import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

import { ProductList } from './ProductList';

import { productQueries } from '@/entities/product';
import {
  loadProductListConditions,
  ProductListFilters,
  ProductSearchForm,
  toProductListQuery,
} from '@/features/product';
import { getQueryClient } from '@/shared/get-query-client';

export function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
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
    </>
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
