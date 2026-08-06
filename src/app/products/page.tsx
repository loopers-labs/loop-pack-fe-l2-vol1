import type { Metadata } from 'next';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
import { searchParamsCache } from '@/entities/product/lib/searchParamsParsers';
import { ProductListErrorBoundary } from './_components/ProductListErrorBoundary';
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent';

export const metadata: Metadata = {
  title: '지금 가장 사랑받는 아이템',
  description: '에디터가 엄선한 패션, 뷰티·잡화, 홈, 디지털 아이템을 한눈에. 카테고리별 필터와 인기순·가격순 정렬로 나에게 딱 맞는 상품을 찾아보세요.',
};

interface ProductListPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function ProductListLoader({
  searchParams,
}: ProductListPageProps) {
  const { q, category, sort, page } = await searchParamsCache.parse(searchParams);
  const queryClient = getQueryClient();

  const query = {
    q: q || undefined,
    category,
    sort,
    page,
  };

  await queryClient.ensureQueryData(productListQueryOptions(query));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListContent />
    </HydrationBoundary>
  );
}

export default function ProductListPage({
  searchParams,
}: ProductListPageProps) {
  return (
    <ProductListErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-sm text-text-secondary">
              상품을 불러오는 중...
            </p>
          </div>
        }
      >
        <ProductListLoader searchParams={searchParams} />
      </Suspense>
    </ProductListErrorBoundary>
  );
}
