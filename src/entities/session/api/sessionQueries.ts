import { queryOptions } from '@tanstack/react-query';
import { getMe } from '@/entities/session/api/session';

export const sessionQueries = {
  all: () => ['session'] as const,

  me: () =>
    queryOptions({
      queryKey: [...sessionQueries.all(), 'me'],
      queryFn: getMe,
      // 401은 재시도해도 결과가 바뀌지 않는다 — 기본 3회 재시도를 켜두면
      // 로그아웃 판정이 지수 백오프만큼(수 초) 늦어진다.
      retry: false,
      // 세션은 로그인/로그아웃 시점에만 명시적으로 invalidate된다.
      // 자동 재검증에 기대지 않고 그 사이엔 항상 fresh로 취급한다.
      staleTime: Infinity,
    }),
};
