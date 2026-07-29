import { environmentManager, QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * 기본값은 서버 0회 · 브라우저 3회인데 `??` 병합이라 값을 그냥 넣으면 서버까지 덮어쓴다.
         * 서버는 실패해도 브라우저가 다시 조회하므로 스트리밍을 막지 않게 0회를 유지한다.
         * 브라우저는 3회차에 살아날 확률이 낮은 데 비해 대기만 4초 늘어 2회로 줄인다.
         */
        retry: environmentManager.isServer() ? 0 : 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * 서버는 요청마다 새 client를 만들어 사용자 간 캐시가 섞이지 않게 한다.
 * 브라우저는 하나만 만들어 재사용한다. useState로 만들면 초기 렌더에서 아래 RSC가
 * suspend할 때 React가 client를 버려 캐시가 조용히 초기화된다.
 */
export function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient();

  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}
