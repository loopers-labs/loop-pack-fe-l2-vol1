'use client'

import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
} from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, useState } from 'react'

import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: ApiErrorPolicy.retry,
        throwOnError: ApiErrorPolicy.throwOnError,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        <NuqsAdapter>{children}</NuqsAdapter>
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  )
}
