import { z } from 'zod'
import { create } from 'zustand'
import { pipe } from 'zustand-middleware-pipe'
import {
  createJSONStorage,
  devtools,
  persist,
} from 'zustand-middleware-pipe/middleware'

type CartItems = Partial<Record<string, true>>

type CartState = {
  items: CartItems
}

type CartActions = {
  addToCart: (productId: string) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

type CartStore = CartState & CartActions

const initialCartState: CartState = {
  items: {},
}

const CART_STORAGE_KEY = 'commerce-cart'
const CART_STORAGE_VERSION = 1

const persistedCartSchema = z.object({
  items: z.record(z.string(), z.literal(true)),
})

const migrateCart = (persisted: unknown): CartState => {
  const parsed = persistedCartSchema.safeParse(persisted)
  if (parsed.success) {
    return { items: parsed.data.items }
  }
  return initialCartState
}

export const useCartStore = create<CartStore>()(
  pipe
    .use(devtools({ name: 'CartStore' }))
    .use(
      persist<CartStore, CartState>({
        name: CART_STORAGE_KEY,
        version: CART_STORAGE_VERSION,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ items: state.items }),
        migrate: (persistedState) => migrateCart(persistedState),
        skipHydration: true,
      }),
    )
    .create((set) => ({
      ...initialCartState,
      addToCart: (productId) => {
        set(
          (state) => ({ items: { ...state.items, [productId]: true } }),
          false,
          'addToCart',
        )
      },
      removeFromCart: (productId) => {
        set(
          (state) => {
            const { [productId]: _removed, ...rest } = state.items
            return { items: rest }
          },
          false,
          'removeFromCart',
        )
      },
      clearCart: () => {
        set(() => initialCartState, false, 'clearCart')
      },
    })),
)

export const cartSelectors = {
  count: (state: CartStore) => Object.keys(state.items).length,
  isInCart: (productId: string) => (state: CartStore) =>
    state.items[productId] === true,
} as const
