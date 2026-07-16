import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

// App Router: 서버에서는 요청마다 새 인스턴스를 만들어 요청 간 캐시 공유/누수를 막고,
// 브라우저에서는 하나의 싱글톤을 재사용해 SPA 이동 중 캐시를 유지한다. (AI 활용)
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 기본 staleTime. 각 쿼리 팩토리에서 데이터 성격에 맞게 덮어쓴다.
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // pending 상태 쿼리도 dehydration에 포함시켜 Server Component prefetch 결과를
        // 클라이언트가 이어받을 수 있게 한다 (Advanced B 연동 대비).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
