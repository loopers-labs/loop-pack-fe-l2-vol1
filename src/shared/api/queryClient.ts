import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './fetcher';

// 클라이언트 Provider에서 useState 초기값으로 사용할 QueryClient를 만든다. (AI 활용)
export const makeQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 기본 staleTime. 각 쿼리 팩토리에서 데이터 성격에 맞게 덮어쓴다.
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        throwOnError: (err) => err instanceof ApiError && err.status >= 500,
      },
    },
  });
};
