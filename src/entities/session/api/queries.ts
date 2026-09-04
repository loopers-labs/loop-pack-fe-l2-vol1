import { queryOptions } from '@tanstack/react-query'
import { getSession } from '@/entities/session/api/api'

export const sessionQueryKeys = {
  all: ['session'] as const,
}

export const sessionQueries = {
  me: () =>
    queryOptions({
      queryKey: sessionQueryKeys.all,
      // 클라이언트에서는 쿠키를 브라우저가 붙이므로 인자가 없다.
      queryFn: () => getSession(),
      // 세션은 TTL이 1시간이고 화면을 옮길 때마다 다시 물어볼 값이 아니다.
      // 로그인·로그아웃은 각자 캐시를 직접 갱신하므로 그때는 이 값과 무관하게 즉시 반영된다.
      staleTime: 5 * 60 * 1000,
    }),
}
