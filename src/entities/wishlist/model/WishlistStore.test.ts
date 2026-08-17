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

import { useWishlistStore, wishlistSelectors } from './WishlistStore'

const resetWishlist = () => {
  useWishlistStore.setState({ items: {} })
}

const persistWishlistState = (items: Record<string, boolean>) => {
  storage.set(
    'commerce-wishlist',
    JSON.stringify({ state: { items }, version: 1 }),
  )
}

describe('WishlistStore actions', () => {
  beforeEach(() => {
    storage.clear()
    resetWishlist()
  })

  afterEach(() => {
    storage.clear()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('toggleWishlist adds productId when absent', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p1: true })
  })

  it('toggleWishlist removes productId when present', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({})
  })

  it('toggleWishlist preserves other items', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    toggleWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p2: true })
  })

  it('removeFromWishlist removes the productId', () => {
    const { toggleWishlist, removeFromWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    removeFromWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({ p2: true })
  })

  it('removeFromWishlist is a no-op when productId is absent', () => {
    const { removeFromWishlist } = useWishlistStore.getState()
    removeFromWishlist('p1')
    expect(useWishlistStore.getState().items).toEqual({})
  })

  it('clearWishlist empties items', () => {
    const { toggleWishlist, clearWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    clearWishlist()
    expect(useWishlistStore.getState().items).toEqual({})
  })

  it('rehydrate restores valid current-version items and preserves actions', async () => {
    persistWishlistState({ p1: true })

    await useWishlistStore.persist.rehydrate()

    expect(useWishlistStore.getState().items).toEqual({ p1: true })

    const { toggleWishlist: hydratedToggleWishlist } =
      useWishlistStore.getState()

    expect(typeof hydratedToggleWishlist).toBe('function')

    hydratedToggleWishlist('p2')

    expect(useWishlistStore.getState().items).toEqual({ p1: true, p2: true })
  })

  it('rehydrate falls back to an empty state for corrupted current-version items', async () => {
    persistWishlistState({ p1: false })

    await useWishlistStore.persist.rehydrate()

    expect(useWishlistStore.getState().items).toEqual({})
  })
})

describe('wishlistSelectors', () => {
  beforeEach(() => {
    resetWishlist()
  })

  it('wishlistSelectors.count with an empty wishlist returns zero', () => {
    // Arrange
    const state = useWishlistStore.getState()

    // Act
    const count = wishlistSelectors.count(state)

    // Assert
    expect(count).toBe(0)
  })

  it('wishlistSelectors.count when products are selected returns the number of distinct items', () => {
    // Arrange
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')
    toggleWishlist('p3')

    // Act
    const count = wishlistSelectors.count(useWishlistStore.getState())

    // Assert
    expect(count).toBe(3)
  })

  it('wishlistSelectors.count when a wishlist item is removed returns the retained item count', () => {
    // Arrange
    const { toggleWishlist, removeFromWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p2')

    // Act
    removeFromWishlist('p1')

    // Assert
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(1)
  })

  it('wishlistSelectors.count when the only selected item is toggled off returns zero', () => {
    // Arrange
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')

    // Act
    toggleWishlist('p1')

    // Assert
    expect(wishlistSelectors.count(useWishlistStore.getState())).toBe(0)
  })

  it('isInWishlist returns true for added productId', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(true)
  })

  it('isInWishlist returns false for absent productId', () => {
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(false)
  })

  it('isInWishlist returns false after toggle off', () => {
    const { toggleWishlist } = useWishlistStore.getState()
    toggleWishlist('p1')
    toggleWishlist('p1')
    expect(
      wishlistSelectors.isInWishlist('p1')(useWishlistStore.getState()),
    ).toBe(false)
  })
})
