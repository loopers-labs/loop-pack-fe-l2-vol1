import { GC_TIME, STALE_TIME } from '@/shared/constants/time';
import { getProducts } from '@/service/products';
import type { ProductListQuery } from '@/types/commerce';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

export const productsQueries = {
  all: () => ['products'] as const,

  productList: (query: ProductListQuery) =>
    queryOptions({
      queryKey: [...productsQueries.all(), query],
      queryFn: () => getProducts(query),
      staleTime: STALE_TIME.PRODUCT_LIST,
      gcTime: GC_TIME.PRODUCT_LIST,
      placeholderData: keepPreviousData,
    }),
};
