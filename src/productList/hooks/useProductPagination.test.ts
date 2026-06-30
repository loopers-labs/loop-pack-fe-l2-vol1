import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProductPagination } from './useProductPagination'

describe('useProductPagination', () => {
  it('calculates visible page numbers around the current page', () => {
    const { result } = renderHook(() =>
      useProductPagination({ totalCount: 120, pageSize: 12 }),
    )

    act(() => {
      result.current.changePage(5)
    })

    expect(result.current.page).toBe(5)
    expect(result.current.totalPages).toBe(10)
    expect(result.current.pageNumbers).toEqual([3, 4, 5, 6, 7])
  })

  it('never reports fewer than one total page and can reset the page', () => {
    const { result } = renderHook(() =>
      useProductPagination({ totalCount: 0, pageSize: 12 }),
    )

    act(() => {
      result.current.changePage(3)
      result.current.resetPage()
    })

    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.pageNumbers).toEqual([1])
  })
})
