import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetShoppingState,
  useCartCount,
  useIsInCart,
  useIsInWishlist,
  useToggleCart,
  useToggleWishlist,
  useWishlistCount,
} from './shopping'

// 공개 selector 어댑터의 계약만 검증한다. 내부 store에는 직접 접근하지 않는다.

beforeEach(() => {
  resetShoppingState()
})

describe('shopping selector hooks', () => {
  it('같은 상품을 두 번 토글하면 원래대로 돌아온다', () => {
    const { result: isInCart } = renderHook(() => useIsInCart('p1'))
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => toggleCart.current('p1'))
    expect(isInCart.current).toBe(true)

    act(() => toggleCart.current('p1'))
    expect(isInCart.current).toBe(false)
  })

  it('장바구니와 위시리스트는 서로 영향을 주지 않는다', () => {
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
  })

  it('다른 상품을 빼도 남은 상품은 유지된다', () => {
    const { result: firstProduct } = renderHook(() => useIsInCart('p1'))
    const { result: secondProduct } = renderHook(() => useIsInCart('p2'))
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => {
      toggleCart.current('p1')
      toggleCart.current('p2')
      toggleCart.current('p1')
    })

    expect(firstProduct.current).toBe(false)
    expect(secondProduct.current).toBe(true)
  })

  it('개수와 포함 여부는 같은 ID 목록에서 함께 파생된다', () => {
    const { result: cartCount } = renderHook(() => useCartCount())
    const { result: firstProduct } = renderHook(() => useIsInCart('p1'))
    const { result: wishlistProduct } = renderHook(() => useIsInWishlist('p1'))
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => {
      toggleCart.current('p1')
      toggleCart.current('p2')
    })

    expect(cartCount.current).toBe(2)
    expect(firstProduct.current).toBe(true)
    expect(wishlistProduct.current).toBe(false)
  })

  it('세션 상태를 폐기하면 장바구니와 위시리스트가 함께 초기화된다', () => {
    const { result: cartCount } = renderHook(() => useCartCount())
    const { result: wishlistCount } = renderHook(() => useWishlistCount())
    const { result: toggleCart } = renderHook(() => useToggleCart())
    const { result: toggleWishlist } = renderHook(() => useToggleWishlist())

    act(() => {
      toggleCart.current('p1')
      toggleWishlist.current('p2')
      resetShoppingState()
    })

    expect(cartCount.current).toBe(0)
    expect(wishlistCount.current).toBe(0)
  })
})
