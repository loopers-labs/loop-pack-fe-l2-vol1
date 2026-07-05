import type { ChangeEvent } from 'react'

import type {
  ProductListCategory,
  ProductListCategoryFilter,
  ProductListPriceFilter,
  ProductListSortBy,
  ProductListViewMode,
} from '../../types'

export type ProductListUrlSearchParams = {
  readonly category?: ProductListCategory
  readonly q?: string
  readonly page?: number
  readonly sort?: ProductListSortBy
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly inStock?: boolean
  readonly viewMode?: ProductListViewMode
}

export type ProductListUrlSearchParamsPatch = Readonly<{
  readonly [Key in keyof ProductListUrlSearchParams]?:
    | ProductListUrlSearchParams[Key]
    | null
    | undefined
}>

export type ProductListSearchParamsState = {
  readonly category: ProductListCategoryFilter
  readonly minPrice: ProductListPriceFilter
  readonly maxPrice: ProductListPriceFilter
  readonly sortBy: ProductListSortBy
  readonly searchQuery: string
  readonly page: number
  readonly inStockOnly: boolean
  readonly viewMode: ProductListViewMode
}

export type UseProductListSearchParamsOptions = {
  readonly pageSize: number
}

type ProductListSearchInputState = Omit<
  ProductListSearchParamsState,
  'maxPrice' | 'minPrice'
> & {
  readonly maxPrice: string
  readonly minPrice: string
}

export type UseProductListSearchParamsReturn = ProductListSearchInputState & {
  readonly apiQueryString: string
  readonly filterInputSyncKey: number
  readonly handleCategoryChange: (category: ProductListCategoryFilter) => void
  readonly handleMinPriceChange: (minPrice: string) => void
  readonly handleMaxPriceChange: (maxPrice: string) => void
  readonly handleSortChange: (event: ChangeEvent<HTMLSelectElement>) => void
  readonly handleSearchChange: (searchQuery: string) => void
  readonly handleInStockToggle: (event: ChangeEvent<HTMLInputElement>) => void
  readonly handleViewModeChange: (event: ChangeEvent<HTMLSelectElement>) => void
  readonly handlePageChange: (nextPage: number) => void
  readonly handleResetFilters: () => void
}
