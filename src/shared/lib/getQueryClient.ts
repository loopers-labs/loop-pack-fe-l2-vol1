import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiClientError } from '@/shared/api/ApiClientError'
import { ApiErrorPolicy } from '@/shared/api/ApiErrorPolicy'

type QueryClientFactoryOptions = {
  readonly onSessionExpired?: () => void
}

function isProtectedUnauthorized(
  error: Error,
  meta: Readonly<Record<string, unknown>> | undefined,
): boolean {
  return (
    error instanceof ApiClientError &&
    error.status === 401 &&
    meta?.requiresAuth === true
  )
}

function getQueryClient({
  onSessionExpired = () => undefined,
}: QueryClientFactoryOptions = {}) {
  const handleError = (
    error: Error,
    meta: Readonly<Record<string, unknown>> | undefined,
  ) => {
    if (isProtectedUnauthorized(error, meta)) {
      onSessionExpired()
    }
  }

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleError(error, query.meta)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        handleError(error, mutation.meta)
      },
    }),
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
