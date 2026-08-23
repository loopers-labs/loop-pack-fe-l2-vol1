import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCartCount, useToggleCart } from '@/entities/cart/model/cart'
import {
  useToggleWishlist,
  useWishlistCount,
} from '@/entities/wishlist/model/wishlist'
import { resetStores } from './resetStores'

// store를 capability마다 나눈 대가로 격리도 나뉘었다. 헬퍼가 한쪽을 빠뜨리면
// 테스트 사이로 상태가 새고, 그 증상은 실패한 테스트가 아니라 순서에 따라 달라지는
// 결과로 나타난다. 헬퍼 자체를 회귀로 고정한다.

describe('resetStores', () => {
  it('두 capability를 모두 비운다', () => {
    const { result: cartCount } = renderHook(() => useCartCount())
    const { result: wishlistCount } = renderHook(() => useWishlistCount())
    const { result: toggleCart } = renderHook(() => useToggleCart())
    const { result: toggleWishlist } = renderHook(() => useToggleWishlist())

    act(() => {
      toggleCart.current('p1')
      toggleWishlist.current('p2')
    })
    expect(cartCount.current).toBe(1)
    expect(wishlistCount.current).toBe(1)

    act(() => resetStores())

    expect(cartCount.current).toBe(0)
    expect(wishlistCount.current).toBe(0)
  })

  it('한 capability를 토글해도 다른 capability는 그대로다', () => {
    const { result: cartCount } = renderHook(() => useCartCount())
    const { result: wishlistCount } = renderHook(() => useWishlistCount())
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => {
      resetStores()
      toggleCart.current('p1')
    })

    expect(cartCount.current).toBe(1)
    expect(wishlistCount.current).toBe(0)
  })
})
