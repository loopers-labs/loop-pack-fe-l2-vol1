'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

interface ProvidersProps {
  children: React.ReactNode
}

export const createBrowserQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      // 정책이 없는 새 쿼리도 한 화면 안의 중복 요청은 피한다.
      // 도메인별 팩토리가 더 구체적인 staleTime으로 덮어쓴다.
      queries: { retry: 1, staleTime: 20_000 },
    },
  })

export default function Providers({ children }: ProvidersProps) {
  // QueryClient는 컴포넌트 수명에 묶어 한 번만 만든다.
  // 모듈 스코프에 두면 서버 렌더 시 요청 간 캐시가 섞인다.
  const [queryClient] = useState(createBrowserQueryClient)

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  )
}
