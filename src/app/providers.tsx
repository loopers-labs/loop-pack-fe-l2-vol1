'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { isRetryable } from '@/lib/commerce/api'

interface ProvidersProps {
  children: React.ReactNode
}

export const MAX_QUERY_RETRIES = 1

export const createBrowserQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      // 정책이 없는 새 쿼리도 한 화면 안의 중복 요청은 피한다.
      // 도메인별 팩토리가 더 구체적인 staleTime으로 덮어쓴다.
      queries: {
        // 400대는 같은 요청을 다시 보내도 결과가 같다. 자동 재시도는 사용자가 기다리는
        // 시간만 늘린다. 서버 오류, 네트워크 실패, 타임아웃에만 한 번 더 시도한다.
        retry: (failureCount, error) =>
          isRetryable(error) && failureCount < MAX_QUERY_RETRIES,
        staleTime: 20_000,
      },
    },
  })

export default function Providers({ children }: ProvidersProps) {
  // QueryClient를 Provider 최초 렌더에 한 번만 만든다.
  // 본문에서 생성하면 리렌더마다 새 인스턴스가 되어 캐시가 초기화된다.
  // 서버 prefetch를 추가하면 요청마다 새로 만들어야 한다.
  // 모듈 스코프에 하나를 두면 요청 사이로 캐시가 샌다.
  const [queryClient] = useState(createBrowserQueryClient)

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  )
}
