import { QueryClient } from '@tanstack/react-query';

// 서버 전용 — 호출할 때마다 새 QueryClient를 만든다(과제 계약).
// generateMetadata와 본문 prefetch가 캐시를 공유하지 않아도 되는 이유:
// 같은 render/request 안에서 URL·options가 같은 native fetch는 Next가 memoize하므로
// Route Handler 실제 호출은 1회다(서버 계수로 확인). singleton·영속 캐시로 바꾸지 않는다.
export function getQueryClient(): QueryClient {
  return new QueryClient();
}
