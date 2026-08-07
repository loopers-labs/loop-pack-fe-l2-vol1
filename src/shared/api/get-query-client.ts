import { QueryClient } from "@tanstack/react-query";

// 서버에서는 호출할 때마다 새 QueryClient를 만든다 (요청 간 캐시 공유 금지)
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}
