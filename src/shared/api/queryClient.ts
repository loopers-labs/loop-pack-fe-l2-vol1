import { QueryClient, defaultShouldDehydrateQuery, environmentManager } from '@tanstack/react-query';

//AI 생성
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * 서버: 매 요청마다 새 인스턴스(요청 간 캐시 격리).
 * 브라우저: 싱글턴(리렌더·Suspense 중 재생성 방지).
 */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
