import {
  type QueryKey,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useState } from 'react'

import type { ProductListResponse } from '@/entities/product/model/types'
import { ProductListStatePolicy } from '@/views/product-list/model/ProductListStatePolicy'

export function useProductListState(
  query: UseQueryResult<ProductListResponse>,
  currentKey: QueryKey,
  scope: string,
) {
  const queryClient = useQueryClient()
  const [lastSuccessful, setLastSuccessful] = useState<{
    readonly key: QueryKey
    readonly scope: string
  } | null>(null)
  const isRealSuccess = query.isSuccess && !query.isPlaceholderData
  if (isRealSuccess && lastSuccessful?.scope !== scope) {
    setLastSuccessful({ key: currentKey, scope })
  }
  const state = ProductListStatePolicy.resolve({
    query,
    currentKey,
    lastSuccessfulKey: isRealSuccess
      ? currentKey
      : (lastSuccessful?.key ?? null),
    queryClient,
  })

  return state
}
