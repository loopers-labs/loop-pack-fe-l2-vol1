import { apiClient } from '@/shared/api/apiClient';
import { queryOptions } from '@tanstack/react-query';

import type { ProductDetailResponse } from '../model/types';

const fetchProductDetail = (id: string) => apiClient.get<ProductDetailResponse>(`/products/${id}`);

/**
 * 상품 상세 쿼리 팩토리.
 *
 * 이 화면은 서버 컴포넌트라 브라우저가 이 옵션으로 재조회하지 않는다. HydrationBoundary 도 두지
 * 않는다 — 넘겨줄 클라이언트 쿼리가 없다. 그래도 팩토리를 두는 이유는 **조회하는 곳이 둘이기
 * 때문**이다: 본문과 generateMetadata. 각자 apiClient 를 직접 부르면 경로 문자열이 두 곳에
 * 적히고, 한쪽만 고쳐도 아무도 알려주지 않는다.
 *
 * staleTime 을 두지 않는다. 서버에서 요청마다 새 QueryClient 로 한 번 조회하고 끝이라
 * fresh 기간이 의미를 갖는 두 번째 조회가 없다.
 */
export const productDetailQueryOptions = {
  detail: (id: string) =>
    queryOptions({
      queryKey: ['product-detail', id] as const,
      queryFn: () => fetchProductDetail(id),
    }),
};
