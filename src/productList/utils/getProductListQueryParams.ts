import type { ProductListGetFetchParams } from '../dto';

/**
 * 상품 목록 조회 파라미터를 URL 쿼리 문자열로 변환하는 순수함수
 * - 분리 기준: 분리한 service api 함수 안에서 파라미터 포맷 로직이 섞인다면, api 함수만을 반환하는 책임이 꺠진다고 생각하여 순수함수로 분리하였습니다.
 */
export const getProductListQueryParams = (params: ProductListGetFetchParams) => {
  const search = new URLSearchParams();

  if (params.category && params.category !== 'all') search.set('category', params.category);
  if (params.sort) search.set('sort', params.sort);
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.size) search.set('size', String(params.size));
  if (params.minPrice !== undefined && params.minPrice !== '') search.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined && params.maxPrice !== '') search.set('maxPrice', String(params.maxPrice));
  if (params.inStock) search.set('inStock', 'true');

  return search.toString();
};
