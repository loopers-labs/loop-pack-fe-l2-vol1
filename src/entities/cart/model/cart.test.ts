import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetCart, useCartCount, useIsInCart, useToggleCart } from './cart'

// 공개 selector 어댑터의 계약만 검증한다. 내부 store에는 직접 접근하지 않는다.
// 이 파일은 wishlist를 import하지 않는다. 위시리스트를 지워도 그대로 통과해야 한다.

beforeEach(() => {
  resetCart()
})

describe('cart capability', () => {
  it('같은 상품을 두 번 토글하면 원래대로 돌아온다', () => {
    const { result: isInCart } = renderHook(() => useIsInCart('p1'))
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => toggleCart.current('p1'))
    expect(isInCart.current).toBe(true)

    act(() => toggleCart.current('p1'))
    expect(isInCart.current).toBe(false)
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
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => {
      toggleCart.current('p1')
      toggleCart.current('p2')
    })

    expect(cartCount.current).toBe(2)
    expect(firstProduct.current).toBe(true)
  })

  it('reset하면 담긴 상품이 비워진다', () => {
    const { result: cartCount } = renderHook(() => useCartCount())
    const { result: toggleCart } = renderHook(() => useToggleCart())

    act(() => {
      toggleCart.current('p1')
      resetCart()
    })

    expect(cartCount.current).toBe(0)
  })
})
