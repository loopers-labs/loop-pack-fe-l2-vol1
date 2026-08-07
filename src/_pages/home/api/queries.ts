import { queryOptions } from '@tanstack/react-query'
import { fetchHome } from './api'

export function homeQueryOptions() {
  return queryOptions({
    queryKey: ['home'] as const,
    queryFn: fetchHome,
  })
}
