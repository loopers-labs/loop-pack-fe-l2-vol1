import { queryOptions } from '@tanstack/react-query';
import type { HomeResponse } from '@/types/commerce';

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ['home'],
    queryFn: async (): Promise<HomeResponse> => {
      const response = await fetch('/api/home');
      if (!response.ok) throw new Error('홈 데이터를 불러오지 못했습니다.');
      return response.json();
    },
    // 홈 배너·인기·신상품은 자주 바뀌지 않으므로 5분간 fresh 유지
    staleTime: 5 * 60 * 1000,
  });
}
