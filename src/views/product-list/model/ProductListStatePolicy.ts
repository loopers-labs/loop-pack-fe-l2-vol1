import type {
  QueryClient,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/react-query'

import type { ProductListResponse } from '@/entities/product/model/types'

type ProductListStateContext = {
  readonly query: QueryObserverResult<ProductListResponse>
  readonly currentKey: QueryKey
  readonly lastSuccessfulKey: QueryKey | null
  readonly queryClient: QueryClient
}

type ProductListState = {
  readonly displayedData: ProductListResponse | undefined
  readonly displayedDataKey: QueryKey | null
  readonly lastSuccessfulKey: QueryKey | null
}

export class ProductListStatePolicy {
  static resolve({
    query,
    currentKey,
    lastSuccessfulKey,
    queryClient,
  }: ProductListStateContext): ProductListState {
    if (query.isSuccess && !query.isPlaceholderData) {
      return {
        displayedData: query.data,
        displayedDataKey: currentKey,
        lastSuccessfulKey: currentKey,
      }
    }

    const retainedData =
      lastSuccessfulKey === null
        ? undefined
        : queryClient.getQueryData<ProductListResponse>(lastSuccessfulKey)

    return {
      displayedData: query.data ?? retainedData,
      displayedDataKey: lastSuccessfulKey,
      lastSuccessfulKey,
    }
  }
}
