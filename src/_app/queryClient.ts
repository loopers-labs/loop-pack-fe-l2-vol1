import { QueryClient, environmentManager } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // true 면 렌더 중 에러를 throw 한다(→ 가장 가까운 에러 경계에 잡힘). retry 를 다 쓰고도 실패한
        // 최종 시점에 평가된다. 보여줄 자기 데이터가 없을 때(첫 로드 실패)만 throw 한다. 이미 목록을 보던 중
        // background refetch 가 실패하면(data 존재) throw 하지 않는다 — throw 하면 멀쩡히 보던 목록이
        // 통째로 에러 화면으로 교체되므로, stale 데이터를 그대로 유지한다.
        throwOnError: (_error, query) => query.state.data === undefined,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr#initial-setup
export function getQueryClient() {
  // 서버: 요청마다 새 인스턴스 — 요청 간 캐시가 섞이지 않게 한다.
  if (environmentManager.isServer()) return makeQueryClient();

  // 브라우저: 싱글톤 — 렌더마다 새로 만들면 캐시가 초기화된다.
  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}
