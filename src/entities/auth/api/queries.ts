import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/fetcher';
import type { SessionResponse } from '@/entities/auth/model';

// [AI] "나 누구야?" 조회. 미로그인이면 401이 돌아오는데, 이는 실패가 아니라
// "로그인 안 함"이라는 정상 답변이다 (RFC 401 두 얼굴 구분 규칙).
export const meQueries = {
  me: () =>
    queryOptions({
      queryKey: ['auth', 'me'],
      queryFn: () => apiFetch<SessionResponse>('/api/auth/me'),
      // 401 = 정상 답변이므로 재시도가 무의미하다. 즉시 isError로 분기한다.
      retry: false,
      // 세션은 아무도 건드리지 않아도 시간이 지나면 스스로 무효가 되는 서버 상태라
      // 오래 믿지 않는다 — 페이지에 도착할 때마다 다시 묻는다.
      staleTime: 0,
    }),
};
