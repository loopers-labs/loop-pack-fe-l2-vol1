import { environmentManager, QueryClient } from '@tanstack/react-query';

import { isUnauthorizedError } from './api-client';

function makeQueryClient() {
  const maxRetryCount = environmentManager.isServer() ? 0 : 2;

  return new QueryClient({
    defaultOptions: {
      queries: {
        // 401은 다시 로그인하기 전엔 몇 번을 보내도 같으므로 재시도하지 않는다.
        retry: (failureCount, error) =>
          !isUnauthorizedError(error) && failureCount < maxRetryCount,
        /**
         * 조회 실패는 각 화면이 인라인으로 처리하지만 401은 세션 만료라 화면 몫이 아니다.
         * 렌더 단계에서 다시 던져 라우트 에러 경계가 상태 정리와 로그인 이동을 한 곳에서 맡는다.
         */
        throwOnError: isUnauthorizedError,
      },
      mutations: {
        throwOnError: isUnauthorizedError,
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
