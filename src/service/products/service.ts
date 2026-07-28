import { useQuery } from '@tanstack/react-query'
import { productQueries } from '@/service/products/queries'
import type { GetProductListParams } from '@/service/products/model'

export const useProductListQuery = (params: GetProductListParams) =>
  useQuery(productQueries.list(params))
