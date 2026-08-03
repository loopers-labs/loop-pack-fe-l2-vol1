import { queryOptions } from '@tanstack/react-query';

import type { ProductListQuery } from '../model/types';
import { fetchProductList } from './productListRequest';

/**
 * 상품 목록 조회 결과를 어떻게 캐시하는가.
 *
 * 백엔드 계약(경로·파라미터 이름)은 productListRequest.ts 가 갖는다.
 * 여기는 캐시 정책만 다루므로 백엔드가 바뀌어도 이 파일은 그대로다.
 *
 * queryKey에 query 객체를 그대로 넣어 URL 조건 ↔ query key ↔ API 요청을 일치시킨다.
 * (nuqs URL 상태가 원본이고, 이 key는 그 파생값이다. 별도 상태로 복사하지 않는다.)
 *
 * 필터는 항상 최신 데이터가 보장되어야할 것 같다. staleTime을 짧게 30초정도로 유지한다. 30초가 맞을까...
 */
export const productListQueryOptions = {
  list: (query: ProductListQuery) =>
    queryOptions({
      queryKey: ['products', query] as const,
      queryFn: () => fetchProductList(query),
      staleTime: 30 * 1000,
    }),
};
