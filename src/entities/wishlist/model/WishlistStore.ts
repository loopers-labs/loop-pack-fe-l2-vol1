import { z } from 'zod'
import { create } from 'zustand'
import { pipe } from 'zustand-middleware-pipe'
import {
  createJSONStorage,
  devtools,
  persist,
} from 'zustand-middleware-pipe/middleware'

type WishlistItems = Partial<Record<string, true>>

type WishlistState = {
  items: WishlistItems
}

type WishlistActions = {
  toggleWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  clearWishlist: () => void
}

type WishlistStore = WishlistState & WishlistActions

const initialWishlistState: WishlistState = {
  items: {},
}

const WISHLIST_STORAGE_KEY = 'commerce-wishlist'
const WISHLIST_STORAGE_VERSION = 1

const persistedWishlistSchema = z.object({
  items: z.record(z.string(), z.literal(true)),
})

const migrateWishlist = (persisted: unknown): WishlistState => {
  const parsed = persistedWishlistSchema.safeParse(persisted)
  if (parsed.success) {
    return { items: parsed.data.items }
  }
  return initialWishlistState
}

const mergeWishlistState = (
  persistedState: unknown,
  currentState: WishlistStore,
): WishlistStore => ({
  ...currentState,
  ...migrateWishlist(persistedState),
})

export const useWishlistStore = create<WishlistStore>()(
  pipe
    .use(devtools({ name: 'WishlistStore' }))
    .use(
      persist<WishlistStore, WishlistState>({
        name: WISHLIST_STORAGE_KEY,
        version: WISHLIST_STORAGE_VERSION,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ items: state.items }),
        migrate: (persistedState) => migrateWishlist(persistedState),
        merge: mergeWishlistState,
        skipHydration: true,
      }),
    )
    .create((set) => ({
      ...initialWishlistState,
      toggleWishlist: (productId) => {
        set(
          (state) => {
            if (state.items[productId] !== undefined) {
              const { [productId]: _removed, ...rest } = state.items
              return { items: rest }
            }
            return { items: { ...state.items, [productId]: true } }
          },
          false,
          'toggleWishlist',
        )
      },
      removeFromWishlist: (productId) => {
        set(
          (state) => {
            const { [productId]: _removed, ...rest } = state.items
            return { items: rest }
          },
          false,
          'removeFromWishlist',
        )
      },
      clearWishlist: () => {
        set(() => initialWishlistState, false, 'clearWishlist')
      },
    })),
)

export const wishlistSelectors = {
  count: (state: WishlistStore) => Object.keys(state.items).length,
  isInWishlist: (productId: string) => (state: WishlistStore) =>
    state.items[productId] === true,
} as const
