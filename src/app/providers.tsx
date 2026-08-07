'use client'

import {
  QueryClientProvider,
  QueryErrorResetBoundary,
} from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, useState } from 'react'

import { getQueryClient } from '@/shared/lib/getQueryClient'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        <NuqsAdapter>{children}</NuqsAdapter>
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  )
}
