import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/fetcher';
import type { ProductListQuery, ProductListResponse } from '@/types/commerce';

export const fetchProductList = (query: ProductListQuery) =>
  apiFetch<ProductListResponse>('/api/products', { query });

// 화면 기본 정렬은 latest. 과제 계약에 따라 API 요청에 sort=latest를 명시한다.
export const DEFAULT_PRODUCT_LIST_QUERY: ProductListQuery = {
  q: '',
  category: 'all',
  sort: 'latest',
  page: 1,
  pageSize: 12,
};

// 검색·카테고리·정렬·페이지 조건이 query key에 모두 포함되므로
// 조건이 바뀔 때마다 별도 캐시 항목이 만들어진다. (AI 활용)
export const productQueries = {
  // 목록은 필터/페이지가 자주 바뀌므로 홈보다 짧은 30초만 fresh로 둔다.
  // 앞뒤 이동으로 같은 조건이 다시 오면 캐시를 즉시 보여준다.
  list: (query: ProductListQuery) =>
    queryOptions({
      queryKey: ['products', 'list', query],
      queryFn: () => fetchProductList(query),
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    }),
};
