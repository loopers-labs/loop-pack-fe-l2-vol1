import type { ProductListQuery } from '@/types/commerce';

/**
 * ProductListQuery(사용자 URL 상태)를 상품 목록 API 쿼리스트링으로 변환한다.
 */
export const toSearchQueryParams = (query: ProductListQuery): string => {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};
