import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { ProductListQuery } from '@/types/commerce';
import { getProducts } from './products.api';

export const productQueries = {
  list: (query: ProductListQuery = {}) =>
    queryOptions({
      queryKey: ['products', 'list', query] as const,
      queryFn: () => getProducts(query),
      staleTime: 1000 * 60,
      // 조건 변경(키 변경) 중 기존 목록을 비우지 않는다 — 이전 키 데이터를
      // placeholder로 유지하고 isFetching으로 "갱신 중"만 표시 (2단계 갱신 화면).
      placeholderData: keepPreviousData,
    }),
};
