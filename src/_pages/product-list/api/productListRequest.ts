import { apiClient } from '@/shared/api/apiClient';

import type { ProductListQuery, ProductListResponse } from '../model/types';

/**
 * 상품 목록 백엔드와 어떻게 대화하는가.
 *
 * 엔드포인트 경로, 파라미터 이름, 응답 타입까지 백엔드 계약이 전부 이 파일에 있다.
 * 경로가 바뀌든 파라미터 이름이 바뀌든 여기만 고치면 된다.
 * 캐시를 어떻게 할지(queryKey, staleTime)는 productListQueries.ts 의 몫이라
 * 두 파일은 서로 다른 이유로 바뀐다.
 *
 * shared/lib 에 두지 않는 이유: 시그니처가 ProductListQuery 에 묶여 있어
 * shared 가 상위 레이어 타입을 알아야 한다.
 * features/product-filter 에 두지 않는 이유: 백엔드 파라미터 이름이 바뀌어도
 * 필터 폼은 그대로다. 필터의 책임은 ProductListQuery 를 만드는 데서 끝난다.
 */
const ENDPOINT = '/products';

/**
 * ProductListQuery(사용자 URL 상태)를 이 백엔드가 받는 쿼리스트링으로 옮긴다.
 * 계약 안에 가둬 두려고 export 하지 않는다.
 * scenario 는 검증 전용 제어값이라 여기 포함하지 않는다.
 */
const toSearchParams = (query: ProductListQuery): string => {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.sort) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
};

export const fetchProductList = (query: ProductListQuery) =>
  apiClient.get<ProductListResponse>(`${ENDPOINT}${toSearchParams(query)}`);
