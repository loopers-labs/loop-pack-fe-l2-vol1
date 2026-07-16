import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/fetcher';
import type { HomeResponse } from '@/types/commerce';

export const fetchHome = () => apiFetch<HomeResponse>('/api/home');

export const homeQueries = {
  // 실제로는 상품들의 품절 상태, 가격이 실시간으로 바뀐다는 점을 고려하여 1분으로 설정한다.
  home: () =>
    queryOptions({
      queryKey: ['home'],
      queryFn: fetchHome,
      // staleTime은 default 값 활용(1분)
    }),
};
