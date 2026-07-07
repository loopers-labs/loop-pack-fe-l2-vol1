import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWishlist } from './useWishlist'

describe('useWishlist', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles product ids and persists the wishlist', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      result.current.toggleWishlist(10)
      result.current.toggleWishlist(20)
      result.current.toggleWishlist(10)
    })

    expect(result.current.wishlist).toEqual([20])
    expect(JSON.parse(localStorage.getItem('wishlist') ?? '[]')).toEqual([20])
  })
})
