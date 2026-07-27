'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, useState } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  )
}
