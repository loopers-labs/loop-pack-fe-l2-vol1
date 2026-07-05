import type { Product } from './Product'

export type ProductListResponse = {
  readonly products: Array<Product>
  readonly totalCount: number
}
