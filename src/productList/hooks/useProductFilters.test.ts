import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProductFilters } from './useProductFilters'

describe('useProductFilters', () => {
  it('stores product filters and notifies when a filter changes', () => {
    const onFilterChange = vi.fn()
    const { result } = renderHook(() => useProductFilters({ onFilterChange }))

    act(() => {
      result.current.changeCategory('fashion')
      result.current.changeMinPrice('10000')
      result.current.changeMaxPrice('')
      result.current.changeSortBy('price-desc')
      result.current.changeSearchQuery('coat')
      result.current.changeInStockOnly(true)
    })

    expect(result.current.category).toBe('fashion')
    expect(result.current.minPrice).toBe(10000)
    expect(result.current.maxPrice).toBe('')
    expect(result.current.sortBy).toBe('price-desc')
    expect(result.current.searchQuery).toBe('coat')
    expect(result.current.inStockOnly).toBe(true)
    expect(onFilterChange).toHaveBeenCalledTimes(6)
  })

  it('resets every filter to the default product list state', () => {
    const onFilterChange = vi.fn()
    const { result } = renderHook(() => useProductFilters({ onFilterChange }))

    act(() => {
      result.current.changeCategory('beauty')
      result.current.changeMinPrice('30000')
      result.current.changeSortBy('popular')
      result.current.changeSearchQuery('serum')
      result.current.changeInStockOnly(true)
    })

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.category).toBe('all')
    expect(result.current.minPrice).toBe('')
    expect(result.current.maxPrice).toBe('')
    expect(result.current.sortBy).toBe('latest')
    expect(result.current.searchQuery).toBe('')
    expect(result.current.inStockOnly).toBe(false)
  })

  it('normalizes invalid price input to an empty filter value', () => {
    const { result } = renderHook(() => useProductFilters())

    act(() => {
      result.current.changeMinPrice('abc')
      result.current.changeMaxPrice('NaN')
    })

    expect(result.current.minPrice).toBe('')
    expect(result.current.maxPrice).toBe('')
  })
})
