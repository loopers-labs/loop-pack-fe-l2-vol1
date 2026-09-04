import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleMutationError, handleQueryError } from "@/entities/session";

// 브라우저와 서버가 같은 기본값을 쓰게 한 곳에서 만든다.
// 양쪽이 어긋나면 hydration 직후 재요청이 난다.
const defaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    retry: 1,
  },
};

// 세션 만료 판단이 붙는 클라이언트. 여기 말고 어디에서도 401을 해석하지 않는다
// (entities/session/model/sessionExpiry.ts).
//
// **조회와 변경 둘 다 붙인다.** QueryCache만 붙였을 때 주문 전송(mutation)의 401이
// 판정을 안 타서, 만료된 사용자가 주문서에 남아 있었다.
export function createBrowserQueryClient(): QueryClient {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      handleQueryError(error, query, client);
    },
  });
  const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      handleMutationError(error, mutation, client);
    },
  });
  const client = new QueryClient({ queryCache, mutationCache, defaultOptions });
  return client;
}

// 서버에서는 요청마다 새로 만든다(getQueryClient.ts 주석 참조).
// 만료 처리는 붙이지 않는다 — 서버 렌더는 한 번에 끝나고, 되돌릴 화면이 없다.
export function createServerQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}
