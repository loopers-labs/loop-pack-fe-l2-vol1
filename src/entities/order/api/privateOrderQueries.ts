import type { QueryClient } from '@tanstack/react-query'

export const PRIVATE_ORDER_QUERY_KEY = ['private', 'orders'] as const

export async function resetPrivateOrderQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: PRIVATE_ORDER_QUERY_KEY })
  queryClient.removeQueries({ queryKey: PRIVATE_ORDER_QUERY_KEY })
}
