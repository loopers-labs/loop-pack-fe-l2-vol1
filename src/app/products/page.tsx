import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
import { searchParamsCache } from '@/entities/product/lib/searchParamsParsers';
import { ProductListErrorBoundary } from './_components/ProductListErrorBoundary';
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent';

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
