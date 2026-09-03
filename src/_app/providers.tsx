'use client'

import { useState, type JSX, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AnalyticsInitializer } from '@/analytics/AnalyticsInitializer'
import { ApiError } from '@/shared/api/apiError'

const MAX_RETRY_COUNT = 3
const SERVER_ERROR_STATUS = 500

interface ProvidersProps {
  children: ReactNode
}

// 4xx는 요청 자체가 잘못됐다는 뜻이라 같은 요청을 다시 보내도 같은 응답이 온다.
// 재시도로 얻을 게 없고 오류 화면만 늦어지므로 즉시 실패로 넘긴다.
// 서버 오류(5xx)·네트워크 오류처럼 일시적일 수 있는 것만 기본 횟수만큼 재시도한다.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < SERVER_ERROR_STATUS) {
    return false
  }
  return failureCount < MAX_RETRY_COUNT
}

// QueryClient는 컴포넌트 수명 동안 하나만 유지한다.
// 렌더마다 새로 만들면 캐시가 초기화되므로 useState 초기화 함수로 1회만 생성한다.
export function Providers({ children }: ProvidersProps): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsInitializer />
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  )
}
