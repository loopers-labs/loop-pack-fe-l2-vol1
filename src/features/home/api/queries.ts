import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/fetcher';
import type { HomeResponse } from '@/types/commerce';

export const fetchHome = () => apiFetch<HomeResponse>('/api/home');

// queryOptions 팩토리: query key, queryFn, 캐시 정책을 한 곳에 둬서
// useQuery와 서버 prefetchQuery(prefetch)가 같은 정의를 재사용한다. (AI 활용)
export const homeQueries = {
  // 홈은 배너·카테고리·추천 상품으로 구성된 조합형 응답.
  // 갱신 주기가 짧지 않고 사용자 액션으로 바뀌지 않으므로 5분간 fresh로 둔다.
  home: () =>
    queryOptions({
      queryKey: ['home'],
      queryFn: fetchHome,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }),
};
