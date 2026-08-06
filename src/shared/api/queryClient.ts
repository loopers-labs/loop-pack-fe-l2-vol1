import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

import { ApiError, isServerError } from "@/shared/api/apiError";

// 서버 프리패치와 클라이언트 Provider가 같은 기본값으로 QueryClient를 만든다.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 하이드레이션 직후 곧바로 다시 조회하지 않도록 기본 staleTime을 둔다.
        // 각 queryOptions 팩토리가 필요하면 이 값을 덮어쓴다.
        staleTime: 1000 * 60,
        // HTTP(4xx·5xx)·business 오류는 재시도해도 같은 응답이라 즉시 표면화한다(경계·인라인).
        // 기본 3회 재시도는 에러 화면을 backoff만큼(~7s) 늦추는 순수 낭비이므로 하지 않고,
        // 일시적일 수 있는 네트워크 실패만 1회 재시도한다.
        retry: (failureCount, error) =>
          error instanceof ApiError && error.kind === "network" ? failureCount < 1 : false,
        // 전파 정책을 한 곳에 둔다. 5xx·예상 밖 서버 오류는 경계로 던지되,
        // 보여줄 데이터가 없을 때(첫 조회 실패)만 던진다. 이미 데이터가 있으면(배경 재조회 실패)
        // 던지지 않아, 멀쩡한 화면을 경계로 덮지 않고 그 자리에서 인라인으로 알린다.
        // 4xx·네트워크는 항상 화면 안 isError로 처리된다.
        // 예외가 필요한 쿼리만 각 useQuery에서 throwOnError를 덮어쓴다.
        throwOnError: (error, query) => isServerError(error) && query.state.data === undefined,
      },
      dehydrate: {
        // 기본은 성공한 쿼리만 직렬화한다.
        // pending까지 포함하면 await 없이 시작만 한 프리패치를 스트리밍으로 이어줄 수 있다.
        // await하는 쿼리에는 영향이 없다.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}
