import { queryOptions } from '@tanstack/react-query';

import { getHome, getProducts } from './api';

import type { ProductListQuery } from '@/types/commerce';

/**
 * 상품 도메인 쿼리 팩토리
 */
export const productQueries = {
  home: () =>
    queryOptions({
      queryKey: ['products', 'home'] as const,
      queryFn: getHome,
      // FIXME: staleTime, gcTime 설계
    }),

  list: (conditions: Required<ProductListQuery>) =>
    queryOptions({
      queryKey: ['products', 'list', conditions] as const,
      queryFn: () => getProducts(conditions),
      // FIXME: staleTime, gcTime 설계
    }),
};
