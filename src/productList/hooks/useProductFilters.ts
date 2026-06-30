import { useState } from 'react'
import type { ProductCategoryFilter, SortBy } from '../types'

type UseProductFiltersParams = {
  onFilterChange?: () => void
}

export function useProductFilters({
  onFilterChange,
}: UseProductFiltersParams = {}) {
  const [category, setCategory] = useState<ProductCategoryFilter>('all')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<SortBy>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  const notifyFilterChange = () => {
    onFilterChange?.()
  }

  const changeCategory = (nextCategory: ProductCategoryFilter) => {
    setCategory(nextCategory)
    notifyFilterChange()
  }

  const changeMinPrice = (value: string) => {
    setMinPrice(value === '' ? '' : Number(value))
    notifyFilterChange()
  }

  const changeMaxPrice = (value: string) => {
    setMaxPrice(value === '' ? '' : Number(value))
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
  }
}
