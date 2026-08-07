import type {
  CategoryId,
  ProductListQuery,
  ProductSort,
} from '@/entities/product'
import type { MockApiScenario } from '@/shared/api/types'

export const PRODUCT_CATEGORY_VALUES = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly (CategoryId | 'all')[]
export const PRODUCT_SORT_VALUES = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[]
export const PRODUCT_SCENARIO_VALUES = [
  'empty',
  'error',
  'slow',
] as const satisfies readonly MockApiScenario[]

export const PRODUCT_PAGE_SIZE = 12

interface ParsedProductListParams {
  q: string
  category: CategoryId | 'all'
  sort: ProductSort
  page: number
  scenario: MockApiScenario | null
}

export function normalizeProductListParams(
  params: ParsedProductListParams,
): Required<ProductListQuery> {
  return {
    q: params.q.trim(),
    category: params.category,
    sort: params.sort,
    page: Math.max(1, params.page),
    pageSize: PRODUCT_PAGE_SIZE,
    scenario: params.scenario,
  }
}
