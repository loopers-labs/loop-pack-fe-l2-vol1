import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useRecentlyViewed } from './useRecentlyViewed'

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('moves the latest viewed product to the front and keeps ten ids', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      for (let id = 1; id <= 11; id += 1) {
        result.current.rememberProduct(id)
      }
      result.current.rememberProduct(5)
    })

    expect(result.current.recentlyViewed).toEqual([
      5, 11, 10, 9, 8, 7, 6, 4, 3, 2,
    ])
    expect(JSON.parse(localStorage.getItem('recentlyViewed') ?? '[]')).toEqual([
      5, 11, 10, 9, 8, 7, 6, 4, 3, 2,
    ])
  })
})
