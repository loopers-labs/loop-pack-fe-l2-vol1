import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import ProductView from '@/app/products/_ui/ProductView';
import { getQueryClient } from '@/shared/api/getQueryClient';
import { productsQueryOptions } from '@/entities/product/api/productsQueryOptions';
import type { SearchParams } from 'nuqs';
import { loadProductSearchParams } from '@/features/product-filter/model/loadProductSearchParams';

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductListPage({ searchParams }: PageProps) {
  const { q, category, sort, page } = await loadProductSearchParams(searchParams);
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(productsQueryOptions({ q, category, sort, page }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductView />
    </HydrationBoundary>
  );
}
