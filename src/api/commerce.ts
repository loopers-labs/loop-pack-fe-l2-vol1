import type { HomeResponse, ProductListQuery, ProductListResponse } from '@/types/commerce';

import { apiClient } from '@/api/apiClient';

import { toSearchQueryParams } from '@/utils/toSearchQueryParams';

/**
 * 커머스 도메인 API 함수
 */
export const fetchHome = () => apiClient.get<HomeResponse>('/home');

/**
 * ProductListQuery(사용자 URL 상태)를 쿼리스트링으로 변환해 요청한다.
 * scenario는 검증 전용 제어값이라 여기 포함하지 않는다.
 */
export const fetchProducts = (query: ProductListQuery) =>
  apiClient.get<ProductListResponse>(`/products${toSearchQueryParams(query)}`);
