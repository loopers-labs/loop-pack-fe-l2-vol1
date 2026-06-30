import type { ProductCategoryFilter, SortBy } from '../types'

export type ProductListFiltersState = {
  category: ProductCategoryFilter
  searchQuery: string
  sortBy: SortBy
  minPrice: number | ''
  maxPrice: number | ''
  inStockOnly: boolean
}

export type ProductListUrlState = {
  filters: ProductListFiltersState
  page: number
}

const DEFAULT_FILTERS: ProductListFiltersState = {
  category: 'all',
  searchQuery: '',
  sortBy: 'latest',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
}

const CATEGORIES: ProductCategoryFilter[] = [
  'all',
  'electronics',
  'fashion',
  'home',
  'beauty',
]

const SORT_OPTIONS: SortBy[] = ['latest', 'popular', 'price-asc', 'price-desc']

function readCategory(value: string | null): ProductCategoryFilter {
  return CATEGORIES.includes(value as ProductCategoryFilter)
    ? (value as ProductCategoryFilter)
    : DEFAULT_FILTERS.category
}

function readSortBy(value: string | null): SortBy {
  return SORT_OPTIONS.includes(value as SortBy)
    ? (value as SortBy)
    : DEFAULT_FILTERS.sortBy
}

function readPositiveNumber(value: string | null): number | '' {
  if (!value) {
    return ''
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : ''
}

function readPositivePage(value: string | null): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function readProductListSearchParams(
  params: URLSearchParams,
): ProductListUrlState {
  return {
    filters: {
      category: readCategory(params.get('category')),
      searchQuery: params.get('q') ?? DEFAULT_FILTERS.searchQuery,
      sortBy: readSortBy(params.get('sort')),
      minPrice: readPositiveNumber(params.get('minPrice')),
      maxPrice: readPositiveNumber(params.get('maxPrice')),
      inStockOnly: params.get('inStock') === 'true',
    },
    page: readPositivePage(params.get('page')),
  }
}

export function buildProductListSearchParams({
  filters,
  page,
}: ProductListUrlState) {
  const params = new URLSearchParams()

  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.searchQuery) params.set('q', filters.searchQuery)
  if (page > 1) params.set('page', String(page))
  if (filters.sortBy !== 'latest') params.set('sort', filters.sortBy)
  if (filters.minPrice !== '') params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== '') params.set('maxPrice', String(filters.maxPrice))
  if (filters.inStockOnly) params.set('inStock', 'true')

  return params
}
