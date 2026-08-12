import { QueryClient } from "@tanstack/react-query";

// 서버에서는 호출할 때마다 새 QueryClient를 만든다 (요청 간 캐시 공유 금지)
// 클라이언트는 Providers가 이 팩토리를 한 번만 호출해 인스턴스를 유지한다
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 서버 prefetch·metadata 실패는 응답 시점을 늦추므로 재시도하지 않는다
        retry: typeof window === "undefined" ? false : 3,
      },
    },
  });
}
