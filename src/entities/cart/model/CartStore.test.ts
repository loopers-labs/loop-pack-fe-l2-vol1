import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const { storage } = vi.hoisted(() => {
  const storage = new Map<string, string>()

  const localStorage = {
    clear: () => {
      storage.clear()
    },
    getItem: (key: string) => storage.get(key) ?? null,
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
  }

  vi.stubGlobal('localStorage', localStorage)

  return { storage }
})

import { cartSelectors, useCartStore } from './CartStore'

const resetCart = () => {
  useCartStore.setState({ items: {} })
}

const persistCartState = (items: Record<string, boolean>) => {
  storage.set('commerce-cart', JSON.stringify({ state: { items }, version: 1 }))
}

describe('CartStore actions', () => {
  beforeEach(() => {
    storage.clear()
    resetCart()
  })

  afterEach(() => {
    storage.clear()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
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

  it('rehydrate restores valid current-version items and preserves actions', async () => {
    persistCartState({ p1: true })

    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().items).toEqual({ p1: true })

    const { addToCart: hydratedAddToCart } = useCartStore.getState()

    expect(typeof hydratedAddToCart).toBe('function')

    hydratedAddToCart('p2')

    expect(useCartStore.getState().items).toEqual({ p1: true, p2: true })
  })

  it('rehydrate falls back to an empty state for corrupted current-version items', async () => {
    persistCartState({ p1: false })

    await useCartStore.persist.rehydrate()

    expect(useCartStore.getState().items).toEqual({})
  })
})

describe('cartSelectors', () => {
  beforeEach(() => {
    resetCart()
  })

  it('cartSelectors.count with an empty cart returns zero', () => {
    // Arrange
    const state = useCartStore.getState()

    // Act
    const count = cartSelectors.count(state)

    // Assert
    expect(count).toBe(0)
  })

  it('cartSelectors.count when products are added returns the number of distinct items', () => {
    // Arrange
    const { addToCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')
    addToCart('p3')

    // Act
    const count = cartSelectors.count(useCartStore.getState())

    // Assert
    expect(count).toBe(3)
  })

  it('cartSelectors.count when a cart item is removed returns the retained item count', () => {
    // Arrange
    const { addToCart, removeFromCart } = useCartStore.getState()
    addToCart('p1')
    addToCart('p2')

    // Act
    removeFromCart('p1')

    // Assert
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
