'use client'

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'
import { CollectionOwnerSync } from '@/_app/ui/CollectionOwnerSync'
import { AnalyticsInitializer } from '@/_app/ui/AnalyticsInitializer'
import { ApiError } from '@/shared/api/api-error'
import { LOGIN_PATH, toLoginPath } from '@/shared/lib/to-login-path'

type ProvidersProps = {
  children: React.ReactNode
}

// 감지는 shared가 한다 — ApiError가 이미 status를 들고 있어 새로 만들 것이 없었다.
// 만료로 "판단"하는 것만 앱 정책이라 여기 있다(docs/week-09/decisions.md 4번).
const isSessionExpired = (error: Error) => error instanceof ApiError && error.status === 401

// 클라이언트 쿼리의 401은 전부 만료로 본다(5번). 로그인은 mutation이라 QueryCache를 지나지 않아
// 별도 예외 없이 빠진다 — 여기서 잡으면 비밀번호를 틀렸을 때 /login에서 /login으로 튕긴다.
//
// router가 아니라 window.location인 것은 이 핸들러가 React 밖이기 때문이다. 전체 이동이라
// 남은 클라이언트 상태도 함께 버려지는데, 만료 처리에는 그게 맞다.
const redirectToLogin = () => {
  const { pathname, search } = window.location

  // 이미 로그인 화면이면 보내지 않는다. 로그인 화면의 쿼리가 401을 내면 무한히 되돌게 된다.
  if (pathname === LOGIN_PATH) {
    return
  }

  window.location.assign(toLoginPath(`${pathname}${search}`))
}

export const Providers = ({ children }: ProvidersProps) => {
  // 컴포넌트 생애당 QueryClient 1개만 생성한다. 모듈 전역에서 만들면 서버 요청 간 캐시가
  // 공유되고, 여기서 useState 없이 만들면 리렌더마다 새 인스턴스가 생겨 캐시가 날아간다.
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
