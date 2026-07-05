import type { Product } from '@/entities/product'

export type ProductListStatus =
  | {
      readonly type: 'error'
      readonly error: Error
      readonly onRetry: () => void
    }
  | { readonly type: 'loading' }
  | { readonly type: 'ready' }

export type UseProductListOptions = {
  readonly apiQueryString: string
}

export type UseProductListReturn = {
  readonly isRefreshing: boolean
  readonly products: Array<Product>
  readonly status: ProductListStatus
  readonly totalCount: number
}
