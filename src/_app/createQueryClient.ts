import { QueryCache, QueryClient } from "@tanstack/react-query";
import { handleQueryError } from "@/entities/session";

// 브라우저와 서버가 같은 기본값을 쓰게 한 곳에서 만든다.
// 양쪽이 어긋나면 hydration 직후 재요청이 난다.
const defaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    retry: 1,
  },
};

// 세션 만료 판단이 붙는 클라이언트. QueryCache의 onError가 그 유일한 자리다 —
// 여기 말고 어디에서도 401을 해석하지 않는다(entities/session/model/sessionExpiry.ts).
export function createBrowserQueryClient(): QueryClient {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      handleQueryError(error, query, client);
    },
  });
  const client = new QueryClient({ queryCache, defaultOptions });
  return client;
}

// 서버에서는 요청마다 새로 만든다(getQueryClient.ts 주석 참조).
// 만료 처리는 붙이지 않는다 — 서버 렌더는 한 번에 끝나고, 되돌릴 화면이 없다.
export function createServerQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}
