import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/entities/product/api/productQueries';
import { searchParamsCache } from '@/entities/product/lib/searchParamsParsers';
import { ErrorBoundary } from '@/shared/ui/error-boundary/ErrorBoundary';
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
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-text-secondary">
              {error.message || '오류가 발생했습니다.'}
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    >
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
    </ErrorBoundary>
  );
}
