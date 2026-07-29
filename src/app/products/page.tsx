import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/queries/productQueries';
import { getProductList } from '@/app/api/_data/productService';
import { ProductListContent } from './_components/ProductListContent';

interface ProductListPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductListPage({
  searchParams,
}: ProductListPageProps) {
  const params = await searchParams;
  const queryClient = getQueryClient();

  const query = {
    q: params.q,
    category: (params.category ?? 'all') as 'all',
    sort: (params.sort ?? 'latest') as 'latest',
    page: params.page ? Number(params.page) : 1,
  };

  queryClient.setQueryData(
    productListQueryOptions(query).queryKey,
    getProductList(query),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-sm text-text-secondary">
              상품을 불러오는 중...
            </p>
          </div>
        }
      >
        <ProductListContent />
      </Suspense>
    </HydrationBoundary>
  );
}
