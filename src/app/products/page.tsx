import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '../getQueryClient';
import { productListQueryOptions } from '@/queries/productQueries';
import { CATEGORY_OPTIONS, PRODUCT_SORTS } from '@/types/commerce';
import type { CategoryOption, ProductSort } from '@/types/commerce';
import { ProductListContent } from './_components/ProductListContent';

interface ProductListPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductListPage({
  searchParams,
}: ProductListPageProps) {
  const params = await searchParams;
  const queryClient = getQueryClient();

  const category = (CATEGORY_OPTIONS as readonly string[]).includes(params.category ?? '')
    ? (params.category as CategoryOption)
    : 'all';
  const sort = (PRODUCT_SORTS as readonly string[]).includes(params.sort ?? '')
    ? (params.sort as ProductSort)
    : 'latest';

  const query = {
    q: params.q,
    category,
    sort,
    page: params.page ? Number(params.page) : 1,
  };

  await queryClient.ensureQueryData(productListQueryOptions(query));

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
