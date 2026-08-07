import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { getHome, getProducts } from './fetch-product';
import type { ProductListQuery } from './types';

type ProductListConditions = Required<ProductListQuery>;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * 상품 도메인 쿼리 팩토리
 */
export const productQueries = {
  all: () => ['products'] as const,

  home: () =>
    queryOptions({
      queryKey: [...productQueries.all(), 'home'] as const,
      queryFn: getHome,
      staleTime: 5 * MINUTE,
      gcTime: 10 * MINUTE,
    }),

  list: (conditions: ProductListConditions) =>
    queryOptions({
      queryKey: [...productQueries.all(), 'list', conditions] as const,
      queryFn: () => getProducts(conditions),
      staleTime: MINUTE,

      /**
       * 조건이 무엇이 바뀌든 새 목록이 올 때까지 이전 목록을 유지한다.
       * 목록을 즉시 비우면 사용자가 최초 진입과 갱신을 구분할 수 없다.
       */
      placeholderData: keepPreviousData,
    }),
};
