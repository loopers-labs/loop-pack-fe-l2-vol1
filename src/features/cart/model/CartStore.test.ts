import { beforeEach, describe, expect, it } from 'vitest'

import { cartSelectors, useCartStore } from './CartStore'

const resetCart = () => {
  useCartStore.setState({ items: {} })
}

describe('CartStore actions', () => {
  beforeEach(() => {
    resetCart()
  })

  it('addToCart adds productId to items', () => {
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    expect(useCartStore.getState().items).toEqual({ p1: true })
  })

  it('addToCart is idempotent for the same productId', () => {
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p1')
    expect(useCartStore.getState().items).toEqual({ p1: true })
  })

  it('addToCart preserves other items', () => {
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    expect(useCartStore.getState().items).toEqual({ p1: true, p2: true })
  })

  it('removeFromCart removes the productId', () => {
    const { addToCart, removeFromCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    removeFromCart('p1')
    expect(useCartStore.getState().items).toEqual({ p2: true })
  })

  it('removeFromCart is a no-op when productId is absent', () => {
    const { removeFromCart } = useCartStore.getState()
    removeFromCart('p1')
    expect(useCartStore.getState().items).toEqual({})
  })

  it('clearCart empties items', () => {
    const { addToCart, clearCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    clearCart()
    expect(useCartStore.getState().items).toEqual({})
  })
})

describe('cartSelectors', () => {
  beforeEach(() => {
    resetCart()
  })

  it('count returns 0 when empty', () => {
    expect(cartSelectors.count(useCartStore.getState())).toBe(0)
  })

  it('count derives from items length', () => {
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    addToCart('p3')
    expect(cartSelectors.count(useCartStore.getState())).toBe(3)
  })

  it('count decreases when an item is removed', () => {
    const { addToCart, removeFromCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    removeFromCart('p1')
    expect(cartSelectors.count(useCartStore.getState())).toBe(1)
  })

  it('isInCart returns true for added productId', () => {
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    expect(cartSelectors.isInCart('p1')(useCartStore.getState())).toBe(true)
  })

  it('isInCart returns false for absent productId', () => {
    expect(cartSelectors.isInCart('p1')(useCartStore.getState())).toBe(false)
  })

  it('isInCart returns false after removeFromCart', () => {
    const { addToCart, removeFromCart } = useCartStore.getState()
    addToCart('p1')
    removeFromCart('p1')
    expect(cartSelectors.isInCart('p1')(useCartStore.getState())).toBe(false)
  })
})
