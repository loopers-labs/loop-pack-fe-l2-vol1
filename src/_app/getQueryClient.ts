import { createServerQueryClient } from "./createQueryClient";

// 서버에서는 호출할 때마다 새 QueryClient를 만든다.
// singleton으로 만들면 요청 간에 캐시가 새어 다른 사용자의 응답을 보여줄 수 있다.
// 세션이 들어온 뒤로는 이게 더 중요해졌다 — 캐시에 남은 SessionState가 새면
// 다른 사람의 로그인 상태가 초기 HTML에 실린다.
export function getQueryClient() {
  return createServerQueryClient();
}
