import { useCallback, useState } from 'react'
import type { ProductCategoryFilter, SortBy } from '../types'
import type { ProductListFiltersState } from '../utils/productListUrl'

type UseProductFiltersParams = {
  initialFilters?: ProductListFiltersState
  onFilterChange?: () => void
}

function parsePriceFilter(value: string): number | '' {
  if (value === '') {
    return ''
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : ''
}

export function useProductFilters({
  initialFilters,
  onFilterChange,
}: UseProductFiltersParams = {}) {
  const [category, setCategory] = useState<ProductCategoryFilter>(
    initialFilters?.category ?? 'all',
  )
  const [minPrice, setMinPrice] = useState<number | ''>(
    initialFilters?.minPrice ?? '',
  )
  const [maxPrice, setMaxPrice] = useState<number | ''>(
    initialFilters?.maxPrice ?? '',
  )
  const [sortBy, setSortBy] = useState<SortBy>(
    initialFilters?.sortBy ?? 'latest',
  )
  const [searchQuery, setSearchQuery] = useState(
    initialFilters?.searchQuery ?? '',
  )
  const [inStockOnly, setInStockOnly] = useState(
    initialFilters?.inStockOnly ?? false,
  )

  const notifyFilterChange = () => {
    onFilterChange?.()
  }

  const changeCategory = (nextCategory: ProductCategoryFilter) => {
    setCategory(nextCategory)
    notifyFilterChange()
  }

  const changeMinPrice = (value: string) => {
    setMinPrice(parsePriceFilter(value))
    notifyFilterChange()
  }

  const changeMaxPrice = (value: string) => {
    setMaxPrice(parsePriceFilter(value))
    notifyFilterChange()
  }

  const changeSortBy = (nextSortBy: SortBy) => {
    setSortBy(nextSortBy)
    notifyFilterChange()
  }

  const changeSearchQuery = (nextSearchQuery: string) => {
    setSearchQuery(nextSearchQuery)
    notifyFilterChange()
  }

  const changeInStockOnly = (nextInStockOnly: boolean) => {
    setInStockOnly(nextInStockOnly)
    notifyFilterChange()
  }

  const resetFilters = () => {
    setCategory('all')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('latest')
    setSearchQuery('')
    setInStockOnly(false)
    notifyFilterChange()
  }

  // URL 복원(popstate)용 — 전체 필터를 한 번에 교체한다. page 리셋은 트리거하지 않는다.
  // (popstate 때는 page도 URL에서 함께 복원하므로 onFilterChange를 부르면 안 된다.)
  const applyFilters = useCallback((next: ProductListFiltersState) => {
    setCategory(next.category)
    setMinPrice(next.minPrice)
    setMaxPrice(next.maxPrice)
    setSortBy(next.sortBy)
    setSearchQuery(next.searchQuery)
    setInStockOnly(next.inStockOnly)
  }, [])

  return {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    changeCategory,
    changeMinPrice,
    changeMaxPrice,
    changeSortBy,
    changeSearchQuery,
    changeInStockOnly,
    resetFilters,
    applyFilters,
  }
}
