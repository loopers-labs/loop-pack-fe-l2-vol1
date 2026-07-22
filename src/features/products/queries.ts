import { queryOptions } from '@tanstack/react-query';

import { getHome, getProducts } from './api';

import type { ProductListQuery } from '@/types/commerce';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * 상품 도메인 쿼리 팩토리
 */
export const productQueries = {
  home: () =>
    queryOptions({
      queryKey: ['products', 'home'] as const,
      queryFn: getHome,
      staleTime: 5 * MINUTE,
      gcTime: 10 * MINUTE,
    }),

  list: (conditions: Required<ProductListQuery>) =>
    queryOptions({
      queryKey: ['products', 'list', conditions] as const,
      queryFn: () => getProducts(conditions),
      staleTime: MINUTE,
    }),
};
