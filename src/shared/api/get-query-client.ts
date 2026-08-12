import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 서버 prefetch·metadata 실패는 응답 시점을 늦추므로 재시도하지 않는다
        retry: environmentManager.isServer() ? false : 3,
      },
      dehydrate: {
        // pending 쿼리도 직렬화해 셸을 먼저 보내고 결과는 RSC 스트림으로 합류시킨다
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// 서버에서는 호출할 때마다 새 QueryClient를 만든다 (요청 간 캐시 공유 금지)
// 브라우저에서는 한 인스턴스를 재사용해 Provider가 다시 렌더돼도 캐시가 유지된다
export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
