import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { ProductListQuery } from '../model/product';
import { fetchProductList } from './productsService';
import {
  PRODUCT_LIST_RETRY_COUNT,
  PRODUCT_PRICE_GC_TIME,
  PRODUCT_PRICE_STALE_TIME,
} from '../model/constants';

/* AI-generated : Week 7 Part 2 — queryFn이 받는 { signal }을 fetchProductList로 전달해, 쿼리 키가
   바뀌어 무의미해진 이전 요청이 React Query에 의해 실제로 취소되도록 한다(AbortSignal 미연결 문제 해소) */
/* AI-generated : Week 7 Part 4 — 갱신 실패 노출 지연 수정. 목록은 유지되는데 "갱신에 실패했다"는 신호가
   9,123ms 뒤에야 떴다(실측). React Query 기본 retry 3회의 지수 백오프에 mock API 500ms가 매 시도마다
   더해진 결과다. retry를 PRODUCT_LIST_RETRY_COUNT로 묶어 2,038ms로 줄였다 */
/** 훅을 전혀 쓰지 않는 순수 설정 함수 — Server Component에서도 안전하게 import 가능 */
export const productsQueryOptions = (query: ProductListQuery) =>
  queryOptions({
    queryKey: ['products', query],
    queryFn: ({ signal }) => fetchProductList(query, signal),
    staleTime: PRODUCT_PRICE_STALE_TIME,
    gcTime: PRODUCT_PRICE_GC_TIME,
    placeholderData: keepPreviousData,
    retry: PRODUCT_LIST_RETRY_COUNT,
  });
