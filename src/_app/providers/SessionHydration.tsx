import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { getSession, sessionQueries } from '@/entities/session'
import { getServerQueryClient } from '@/shared/api/query-client'

// 서버가 읽은 세션을 클라이언트 Query 캐시의 초기값으로 넘긴다.
//
// 이게 없으면 로그인한 사용자가 화면을 열 때마다 창이 하나 생긴다. 서버는 이미 사용자를 아는데
// 클라이언트 세션 쿼리는 처음부터 다시 물어보고, 그동안 useCurrentUserId가 null을 돌려준다.
// 그 값이 그대로 두 store의 소유자가 되므로 배지가 0으로 떴다가 점프하고, 그 사이에 담기를 누르면
// 로그인한 사람이 /login으로 튕긴다. 로딩과 미로그인이 같은 null로 표현되던 것이 원인이다.
//
// 요청 횟수도 줄어든다. 같은 render 안의 native fetch는 Next가 합치므로(Header도 같은 주소를
// 부른다) 화면당 /api/auth/me는 한 번이다. 여기서 부르지 않으면 서버 한 번 + 클라이언트 한 번이다.
//
// 미로그인이면 null이 캐시에 담긴다. 그것도 "확정된 답"이라 클라이언트가 다시 묻지 않는다
// (staleTime 5분). 로그인·로그아웃은 각자 캐시를 직접 갱신하므로 그때는 즉시 반영된다.
//
// QueryClientProvider 안쪽이어야 해서 Providers의 children 자리에 둔다. Providers가 Client
// Component라 이 async Server Component는 children으로 합성해 넣는다.
export const SessionHydration = async ({ children }: { children: ReactNode }) => {
  const queryClient = getServerQueryClient()
  // 서버 fetch는 브라우저 쿠키를 자동으로 붙이지 않으므로 읽어서 넘긴다.
  const cookieHeader = (await cookies()).toString()

  await queryClient.prefetchQuery({
    ...sessionQueries.me(),
    queryFn: () => getSession(cookieHeader),
  })

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
}
