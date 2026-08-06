import { queryOptions } from '@tanstack/react-query';
import type { ProductListQuery } from '@/types/commerce';
import { getProducts } from './products.api';

export const productQueries = {
  list: (query: ProductListQuery = {}) =>
    queryOptions({
      queryKey: ['products', 'list', query] as const,
      queryFn: () => getProducts(query),
      staleTime: 1000 * 60,
    }),
};
