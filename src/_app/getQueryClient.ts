import { QueryClient } from "@tanstack/react-query";

// 서버에서는 호출할 때마다 새 QueryClient를 만든다.
// singleton으로 만들면 요청 간에 캐시가 새어 다른 사용자의 응답을 보여줄 수 있다.
// metadata와 본문이 캐시를 공유하게 만들려고 이 규칙을 깨지 않는다 —
// 같은 render/request 안에서 같은 URL·options의 native fetch는 어차피 memoize된다.
export function getQueryClient() {
  return new QueryClient({
    // 브라우저 Providers와 같은 기본값을 쓴다. 양쪽이 어긋나면 hydration 직후 재요청이 난다.
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  });
}
