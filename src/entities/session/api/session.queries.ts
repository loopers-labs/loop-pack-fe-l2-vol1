import { queryOptions } from '@tanstack/react-query';
import { getSession } from './session.api';

// 세션은 서버 상태라 Query로 다룬다 (RFC D1). 키는 한 곳 — 로그인·로그아웃이 같은 키를 갱신한다.
export const sessionQueries = {
  me: () =>
    queryOptions({
      queryKey: ['session', 'me'] as const,
      queryFn: getSession,
      // 서버가 초기 HTML에 넣어준 값을 클라이언트가 마운트 직후 다시 묻지 않게 한다.
      staleTime: 1000 * 60,
    }),
};
