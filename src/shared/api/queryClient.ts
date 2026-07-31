import { QueryClient, environmentManager } from "@tanstack/react-query";
import { isServerError } from "./apiError";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 렌더 중 에러를 throw 할지 결정한다(→ true 면 가장 가까운 에러 경계에 잡힘). retry 를 다 쓰고도
        // 실패한 최종 시점에 평가된다. 두 축으로 경계/인라인을 가른다:
        //  1) 보여줄 자기 데이터가 있으면(background refetch 실패) throw 안 함 — 멀쩡히 보던 목록을
        //     에러 화면으로 통째로 바꾸지 않고 stale 데이터를 유지한다.
        //  2) 첫 로드 실패는 '예상 못한' 서버·네트워크 오류(5xx·network)만 경계로 보낸다. 4xx(잘못된
        //     요청)는 호출부가 화면 안에서 다룰 몫이라 여기서 throw 하지 않는다.
        throwOnError: (error, query) =>
          query.state.data === undefined && isServerError(error),
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
