import { QueryClient } from '@tanstack/react-query'

export function getServerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}
