import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetWishlist,
  useIsInWishlist,
  useToggleWishlist,
  useWishlistCount,
} from './wishlist'

// 공개 selector 어댑터의 계약만 검증한다. cart를 import하지 않는다.

beforeEach(() => {
  resetWishlist()
})

describe('wishlist capability', () => {
  it('같은 상품을 두 번 토글하면 원래대로 돌아온다', () => {
    const { result: isInWishlist } = renderHook(() => useIsInWishlist('p1'))
    const { result: toggleWishlist } = renderHook(() => useToggleWishlist())

    act(() => toggleWishlist.current('p1'))
    expect(isInWishlist.current).toBe(true)

    act(() => toggleWishlist.current('p1'))
    expect(isInWishlist.current).toBe(false)
  })

  it('개수와 포함 여부는 같은 ID 목록에서 함께 파생된다', () => {
    const { result: wishlistCount } = renderHook(() => useWishlistCount())
    const { result: firstProduct } = renderHook(() => useIsInWishlist('p1'))
    const { result: toggleWishlist } = renderHook(() => useToggleWishlist())

    act(() => {
      toggleWishlist.current('p1')
      toggleWishlist.current('p2')
    })

    expect(wishlistCount.current).toBe(2)
    expect(firstProduct.current).toBe(true)
  })

  it('reset하면 찜한 상품이 비워진다', () => {
    const { result: wishlistCount } = renderHook(() => useWishlistCount())
    const { result: toggleWishlist } = renderHook(() => useToggleWishlist())

    act(() => {
      toggleWishlist.current('p1')
      resetWishlist()
    })

    expect(wishlistCount.current).toBe(0)
  })
})
