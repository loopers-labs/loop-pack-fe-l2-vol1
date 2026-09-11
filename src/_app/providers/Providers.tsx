'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'
import { CollectionOwnerSync } from '@/_app/ui/CollectionOwnerSync'
import { AnalyticsInitializer } from '@/_app/ui/AnalyticsInitializer'
import { ApiError } from '@/shared/api/api-error'
import { ROUTES } from '@/shared/config/routes'
import { LOGIN_REASON, toLoginPath } from '@/shared/lib/to-login-path'

type ProvidersProps = {
  children: React.ReactNode
}

const isSessionExpired = (error: Error) => error instanceof ApiError && error.status === 401

/*
  로그인은 mutation이라 QueryCache를 지나지 않으므로 자격 증명 401은 여기서 제외된다.
  만료 시에는 서버 렌더와 클라이언트 상태를 함께 초기화하도록 전체 이동한다.
*/
const redirectToLogin = () => {
  const { pathname, search } = window.location

  // 이미 로그인 화면이면 보내지 않는다. 로그인 화면의 쿼리가 401을 내면 무한히 되돌게 된다.
  if (pathname === ROUTES.LOGIN) {
    return
  }

  window.location.assign(
    toLoginPath(`${pathname}${search}`, { reason: LOGIN_REASON.SESSION_EXPIRED }),
  )
}

export const Providers = ({ children }: ProvidersProps) => {
  /* 컴포넌트 생애당 QueryClient 1개만 생성해 모듈 전역 공유와 리렌더별 재생성을 피한다. */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isSessionExpired(error)) {
              redirectToLogin()
            }
          },
        }),
        defaultOptions: {
          queries: {
            // 401은 다시 물어봐도 같은 답이다. 기본 3회를 그대로 두면 만료 화면이 그만큼 늦게 뜬다.
            retry: (failureCount, error) => !isSessionExpired(error) && failureCount < 3,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {/* 세션이 정해지면 장바구니·위시리스트의 소유자를 맞춘다. 그리는 것은 없다. */}
        <AnalyticsInitializer />
        <CollectionOwnerSync />
        {children}
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
