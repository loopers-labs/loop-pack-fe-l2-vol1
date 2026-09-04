import { queryOptions } from '@tanstack/react-query';
import { getMe } from './getMe';

export const authQueries = {
  all: () => ['auth'] as const,
  // queryKey는 고정하고 cookie 헤더는 queryFn 클로저로만 넘긴다 —
  // 세션 토큰이 캐시 키에 섞이면 서버·클라이언트 캐시가 서로 hit되지 않는다.
  me: (cookieHeader?: string) =>
    queryOptions({
      queryKey: [...authQueries.all(), 'me'],
      queryFn: () => getMe(cookieHeader)
    })
};
