'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'

type ProvidersProps = {
  children: React.ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  // 컴포넌트 생애당 QueryClient 1개만 생성한다. 모듈 전역에서 만들면 서버 요청 간 캐시가
  // 공유되고, 여기서 useState 없이 만들면 리렌더마다 새 인스턴스가 생겨 캐시가 날아간다.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  )
}
