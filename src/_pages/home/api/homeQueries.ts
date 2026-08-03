import { apiClient } from '@/shared/api/apiClient';
import { queryOptions } from '@tanstack/react-query';

import type { HomeResponse } from '../model/types';

const fetchHome = () => apiClient.get<HomeResponse>('/home');

/**
 * 홈 쿼리 팩토리 (서버 prefetch·클라이언트 useQuery 공용).
 *
 * queryFn 을 따로 파일로 나누지 않는다. 홈 조회는 소비자가 이 슬라이스뿐이라
 * 분리해도 재사용되는 곳이 없고, 같은 세그먼트 안에서 협력하는 편이 응집이 낫다.
 *
 * staleTime: 홈(배너·카테고리·인기·신상품)은 자주 바뀌지 않으므로 5분간 fresh로 둬
 *            SSR로 채운 캐시를 클라이언트가 즉시 재요청하지 않게 한다.
 * gcTime 은 기본값(5분)을 사용한다. 홈은 단일 진입점이라 캐시를 오래 붙들 이유가 없다.
 */
export const homeQueryOptions = {
  list: () =>
    queryOptions({
      queryKey: ['home'] as const,
      queryFn: fetchHome,
      staleTime: 5 * 60 * 1000,
    }),
};
