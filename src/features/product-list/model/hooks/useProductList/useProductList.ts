import { productService } from '@/entities/product'
import { useAsync } from '@/shared/lib'

import type { UseProductListOptions, UseProductListReturn } from './types'

export function useProductList({
  apiQueryString,
}: UseProductListOptions): UseProductListReturn {
  const {
    data: productListData,
    error,
    isLoading,
    refetch: refetchProducts,
  } = useAsync({
    asyncFn: () => productService.getProductList(apiQueryString),
    deps: [apiQueryString],
    keepPreviousData: true,
  })

  const products = productListData?.products ?? []
  const totalCount = productListData?.totalCount ?? 0
  const handleRetryProducts = () => {
    void refetchProducts()
  }

  return {
    isRefreshing: isLoading && products.length > 0,
    products,
    status: error
      ? { type: 'error', error, onRetry: handleRetryProducts }
      : isLoading && products.length === 0
        ? { type: 'loading' }
        : { type: 'ready' },
    totalCount,
  }
}
