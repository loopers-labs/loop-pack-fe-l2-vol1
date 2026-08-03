import { NetworkError, TimeoutError } from 'ky'

import { ApiClientError } from '@/shared/api/ApiClient'

export const ApiErrorPolicy = {
  retry: (failureCount: number, error: Error): boolean => {
    if (failureCount !== 0) {
      return false
    }

    if (error instanceof ApiClientError) {
      return error.status >= 500 && error.status < 600
    }

    return error instanceof NetworkError || error instanceof TimeoutError
  },

  throwOnError: (error: Error): boolean => {
    return !(
      error instanceof ApiClientError &&
      error.status >= 400 &&
      error.status < 500
    )
  },
} as const
