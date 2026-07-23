import { queryOptions } from '@tanstack/react-query';

import { getHome, getProducts } from './api';

import type { ProductListQuery, ProductListResponse } from '@/types/commerce';

type ProductListConditions = Required<ProductListQuery>;

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

  list: (conditions: ProductListConditions) =>
    queryOptions({
      queryKey: ['products', 'list', conditions] as const,
      queryFn: () => getProducts(conditions),
      staleTime: MINUTE,
      placeholderData: keepPreviousPage(conditions),
    }),
};

/**
 * 페이지를 넘기는 동안만 이전 목록을 유지한다.
 * 검색·필터·정렬이 바뀌면 목록 자체가 달라지므로 이전 결과를 남기지 않는다.
 */
export const keepPreviousPage =
  (conditions: ProductListConditions) =>
  (
    previousData: ProductListResponse | undefined,
    previousQuery:
      | { queryKey: readonly [string, string, ProductListConditions] }
      | undefined,
  ) =>
    isSameProductSet(previousQuery?.queryKey[2], conditions)
      ? previousData
      : undefined;

const isSameProductSet = (
  previous: ProductListConditions | undefined,
  current: ProductListConditions,
) =>
  previous !== undefined &&
  previous.q === current.q &&
  previous.category === current.category &&
  previous.sort === current.sort &&
  previous.pageSize === current.pageSize;
