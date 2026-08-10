import { QueryClient } from '@tanstack/react-query'

import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

function getQueryClient() {
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

export { getQueryClient }
