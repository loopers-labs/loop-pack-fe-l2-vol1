import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/fetcher';
import type { MockApiScenario } from '@/shared/types/api';
import type { HomeResponse } from '@/widgets/home/model';

// [AI] scenario 쿼리 파라미터를 받아 /api/home?scenario=<value> 형태로 페칭한다.
export const fetchHome = (scenario?: MockApiScenario) =>
  apiFetch<HomeResponse>('/api/home', { query: { scenario } });

export const homeQueries = {
  // 실제로는 상품들의 품절 상태, 가격이 실시간으로 바뀐다는 점을 고려하여 1분으로 설정한다.
  home: (scenario?: MockApiScenario) =>
    queryOptions({
      queryKey: ['home', scenario],
      queryFn: () => fetchHome(scenario),
      // staleTime은 default 값 활용(1분)
    }),
};
