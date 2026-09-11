import { queryOptions } from '@tanstack/react-query'
import { getSession } from '@/entities/session/api/api'

export const sessionQueryKeys = {
  all: ['session'] as const,
}

export const sessionQueries = {
  me: () =>
    queryOptions({
      queryKey: sessionQueryKeys.all,
      /* 클라이언트에서는 쿠키를 브라우저가 붙이므로 Cookie 헤더를 직접 넘기지 않는다. */
      queryFn: ({ signal }) => getSession(undefined, signal),
      /* 세션은 화면 이동마다 다시 조회하지 않고, 로그인·로그아웃 성공 시 캐시를 직접 갱신한다. */
      staleTime: 5 * 60 * 1000,
    }),
}
