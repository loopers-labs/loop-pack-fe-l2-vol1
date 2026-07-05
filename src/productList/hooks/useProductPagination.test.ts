import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProductPagination } from './useProductPagination'

describe('useProductPagination', () => {
  it('calculates visible page numbers around the current page', () => {
    const { result } = renderHook(() => useProductPagination({ pageSize: 12 }))

    act(() => {
      result.current.changePage(5)
    })

    const info = result.current.getPageInfo(120)
    expect(result.current.page).toBe(5)
    expect(info.totalPages).toBe(10)
    expect(info.pageNumbers).toEqual([3, 4, 5, 6, 7])
  })

  it('never reports fewer than one total page and can reset the page', () => {
    const { result } = renderHook(() => useProductPagination({ pageSize: 12 }))

    act(() => {
      result.current.changePage(3)
      result.current.resetPage()
    })

    const info = result.current.getPageInfo(0)
    expect(result.current.page).toBe(1)
    expect(info.totalPages).toBe(1)
    expect(info.pageNumbers).toEqual([1])
  })
})
