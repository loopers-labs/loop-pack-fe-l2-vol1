import type { ChangeEvent } from 'react'
import { useState } from 'react'

import { useSearchParams } from '@/shared/lib'

import type { ProductListCategoryFilter } from '../../types'
import { DEFAULT_PRODUCT_LIST_SEARCH_PARAMS } from './constants'
import { ProductListSearchParamsUtils } from './searchParams'
import type {
  ProductListUrlSearchParams,
  ProductListUrlSearchParamsPatch,
  UseProductListSearchParamsOptions,
  UseProductListSearchParamsReturn,
} from './types'

export function useProductListSearchParams({
  pageSize,
}: UseProductListSearchParamsOptions): UseProductListSearchParamsReturn {
  const [filterInputSyncKey, setFilterInputSyncKey] = useState(0)
  const [searchParams, setSearchParams] =
    useSearchParams<ProductListUrlSearchParams>()
  const state = ProductListSearchParamsUtils.toState(searchParams)
  const apiQueryString = ProductListSearchParamsUtils.toApiQueryString(
    state,
    pageSize,
  )

  const updateSearchParams = (patch: ProductListUrlSearchParamsPatch) => {
    setSearchParams(patch, { history: 'replace' })
  }

  const handleCategoryChange = (category: ProductListCategoryFilter) => {
    updateSearchParams({
      category: category === 'all' ? null : category,
      page: null,
    })
  }

  const handleMinPriceChange = (minPrice: string) => {
    updateSearchParams({
      minPrice: ProductListSearchParamsUtils.toPricePatch(minPrice),
      page: null,
    })
  }

  const handleMaxPriceChange = (maxPrice: string) => {
    updateSearchParams({
      maxPrice: ProductListSearchParamsUtils.toPricePatch(maxPrice),
      page: null,
    })
  }

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSortBy = event.target.value

    if (!ProductListSearchParamsUtils.isSortBy(nextSortBy)) {
      return
    }

    updateSearchParams({ sort: nextSortBy, page: null })
  }

  const handleSearchChange = (searchQuery: string) => {
    updateSearchParams({ q: searchQuery || null, page: null })
  }

  const handleInStockToggle = (event: ChangeEvent<HTMLInputElement>) => {
    updateSearchParams({ inStock: event.target.checked || null, page: null })
  }

  const handleViewModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextViewMode = event.target.value

    if (!ProductListSearchParamsUtils.isViewMode(nextViewMode)) {
      return
    }

    updateSearchParams({
      viewMode:
        nextViewMode === DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.viewMode
          ? null
          : nextViewMode,
    })
  }

  const handlePageChange = (nextPage: number) => {
    updateSearchParams({
      page:
        nextPage === DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.page ? null : nextPage,
    })
  }

  const handleResetFilters = () => {
    setFilterInputSyncKey((currentKey) => currentKey + 1)

    updateSearchParams({
      category: null,
      q: null,
      page: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      inStock: null,
      viewMode: null,
    })
  }

  return {
    ...state,
    maxPrice: ProductListSearchParamsUtils.toPriceInputValue(state.maxPrice),
    minPrice: ProductListSearchParamsUtils.toPriceInputValue(state.minPrice),
    searchQuery: state.searchQuery,
    apiQueryString,
    filterInputSyncKey,
    handleCategoryChange,
    handleMinPriceChange,
    handleMaxPriceChange,
    handleSortChange,
    handleSearchChange,
    handleInStockToggle,
    handleViewModeChange,
    handlePageChange,
    handleResetFilters,
  }
}
