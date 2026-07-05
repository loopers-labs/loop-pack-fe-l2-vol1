import {
  PRODUCT_LIST_CATEGORIES,
  PRODUCT_LIST_SORT_OPTIONS,
  PRODUCT_LIST_VIEW_MODES,
} from '../../../config'
import type {
  ProductListCategory,
  ProductListCategoryFilter,
  ProductListPriceFilter,
  ProductListSortBy,
  ProductListViewMode,
} from '../../types'
import { DEFAULT_PRODUCT_LIST_SEARCH_PARAMS } from './constants'
import type {
  ProductListSearchParamsState,
  ProductListUrlSearchParams,
} from './types'

export class ProductListSearchParamsUtils {
  private constructor() {}

  static isSortBy(value: unknown): value is ProductListSortBy {
    return PRODUCT_LIST_SORT_OPTIONS.some((sortBy) => sortBy === value)
  }

  static isViewMode(value: unknown): value is ProductListViewMode {
    return PRODUCT_LIST_VIEW_MODES.some((viewMode) => viewMode === value)
  }

  static toPricePatch(value: string): number | null {
    if (value === '') {
      return null
    }

    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  static toPriceInputValue(value: ProductListPriceFilter): string {
    return value === '' ? value : String(value)
  }

  static toState(
    searchParams: Readonly<ProductListUrlSearchParams>,
  ): ProductListSearchParamsState {
    return {
      category: ProductListSearchParamsUtils.toCategoryFilter(
        searchParams.category,
      ),
      minPrice: ProductListSearchParamsUtils.toPriceFilter(
        searchParams.minPrice,
      ),
      maxPrice: ProductListSearchParamsUtils.toPriceFilter(
        searchParams.maxPrice,
      ),
      sortBy: ProductListSearchParamsUtils.toSortBy(searchParams.sort),
      searchQuery: ProductListSearchParamsUtils.toSearchQuery(searchParams.q),
      page: ProductListSearchParamsUtils.toPositivePage(searchParams.page),
      inStockOnly: ProductListSearchParamsUtils.toInStockOnly(
        searchParams.inStock,
      ),
      viewMode: ProductListSearchParamsUtils.toViewMode(searchParams.viewMode),
    }
  }

  static toApiQueryString(
    searchParams: ProductListSearchParamsState,
    pageSize: number,
  ): string {
    const apiSearchParams = new URLSearchParams({
      category: searchParams.category,
      sort: searchParams.sortBy,
      q: searchParams.searchQuery,
      page: String(searchParams.page),
      size: String(pageSize),
    })

    if (searchParams.minPrice !== '') {
      apiSearchParams.set('minPrice', String(searchParams.minPrice))
    }

    if (searchParams.maxPrice !== '') {
      apiSearchParams.set('maxPrice', String(searchParams.maxPrice))
    }

    if (searchParams.inStockOnly) {
      apiSearchParams.set('inStock', 'true')
    }

    return apiSearchParams.toString()
  }

  private static isCategory(value: unknown): value is ProductListCategory {
    return PRODUCT_LIST_CATEGORIES.some((category) => category === value)
  }

  private static toCategoryFilter(value: unknown): ProductListCategoryFilter {
    return ProductListSearchParamsUtils.isCategory(value)
      ? value
      : DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.category
  }

  private static toSortBy(value: unknown): ProductListSortBy {
    return ProductListSearchParamsUtils.isSortBy(value)
      ? value
      : DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.sortBy
  }

  private static toPriceFilter(value: unknown): ProductListPriceFilter {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.minPrice
    }

    return value
  }

  private static toPositivePage(value: unknown): number {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.page
    ) {
      return DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.page
    }

    return value
  }

  private static toSearchQuery(value: unknown): string {
    return typeof value === 'string'
      ? value
      : DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.searchQuery
  }

  private static toInStockOnly(value: unknown): boolean {
    return typeof value === 'boolean'
      ? value
      : DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.inStockOnly
  }

  private static toViewMode(value: unknown): ProductListViewMode {
    return ProductListSearchParamsUtils.isViewMode(value)
      ? value
      : DEFAULT_PRODUCT_LIST_SEARCH_PARAMS.viewMode
  }
}
