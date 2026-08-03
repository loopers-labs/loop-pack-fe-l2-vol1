import { useQuery } from '@tanstack/react-query'
import { productQueries } from './queries'
import type { GetProductListParams } from './model'

export const useProductListQuery = (params: GetProductListParams) =>
  useQuery(productQueries.list(params))
