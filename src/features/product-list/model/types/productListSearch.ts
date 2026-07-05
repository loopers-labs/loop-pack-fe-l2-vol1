import type {
  PRODUCT_LIST_CATEGORIES,
  PRODUCT_LIST_SORT_OPTIONS,
  PRODUCT_LIST_VIEW_MODES,
} from '../../config'

export type ProductListCategory = (typeof PRODUCT_LIST_CATEGORIES)[number]
export type ProductListCategoryFilter = 'all' | ProductListCategory
export type ProductListSortBy = (typeof PRODUCT_LIST_SORT_OPTIONS)[number]
export type ProductListViewMode = (typeof PRODUCT_LIST_VIEW_MODES)[number]
export type ProductListPriceFilter = number | ''
