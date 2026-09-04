import { create } from 'zustand'

// 비로그인 로컬 장바구니. id만 저장한다(서버 Product 복사 금지). 개수·담김여부는 파생한다.
interface CartState {
  cartIds: string[]
  cartItemVersions: Record<string, number>
  cartVersionSequence: number
  toggleCart: (id: string) => void
  clearCart: () => void
  captureCartSnapshot: () => CartItemSnapshot[]
  removeCartSnapshot: (snapshot: readonly CartItemSnapshot[]) => void
}

export interface CartItemSnapshot {
  productId: string
  version: number
}

function captureSnapshot(state: CartState): CartItemSnapshot[] {
  const snapshot: CartItemSnapshot[] = []

  state.cartIds.forEach((productId) => {
    const version = state.cartItemVersions[productId]
    if (version !== undefined) {
      snapshot.push({ productId, version })
    }
  })

  return snapshot
}

// store 인스턴스는 모듈 밖으로 내보내지 않는다 — 외부는 selector 훅만 알면 된다.
const useCartStore = create<CartState>((set, get) => ({
  cartIds: [],
  cartItemVersions: {},
  cartVersionSequence: 0,
  toggleCart: (id) =>
    set((state) => {
      if (state.cartIds.includes(id)) {
        const cartItemVersions = { ...state.cartItemVersions }
        delete cartItemVersions[id]
        return {
          cartIds: state.cartIds.filter((value) => value !== id),
          cartItemVersions,
        }
      }

      const version = state.cartVersionSequence + 1
      return {
        cartIds: [...state.cartIds, id],
        cartItemVersions: { ...state.cartItemVersions, [id]: version },
        cartVersionSequence: version,
      }
    }),
  clearCart: () => set({ cartIds: [], cartItemVersions: {} }),
  captureCartSnapshot: () => captureSnapshot(get()),
  removeCartSnapshot: (snapshot) =>
    set((state) => {
      const submittedVersions = new Map(
        snapshot.map(({ productId, version }) => [productId, version]),
      )
      const cartIds = state.cartIds.filter(
        (id) => submittedVersions.get(id) !== state.cartItemVersions[id],
      )
      const retainedIds = new Set(cartIds)
      const cartItemVersions = Object.fromEntries(
        Object.entries(state.cartItemVersions).filter(([id]) =>
          retainedIds.has(id),
        ),
      )

      return { cartIds, cartItemVersions }
    }),
}))

export const useIsInCart = (id: string): boolean =>
  useCartStore((state) => state.cartIds.includes(id))

export const useCartCount = (): number =>
  useCartStore((state) => state.cartIds.length)

export const useCartIds = (): string[] => useCartStore((state) => state.cartIds)

export const useToggleCart = (): ((id: string) => void) =>
  useCartStore((state) => state.toggleCart)

export const useClearCart = (): (() => void) =>
  useCartStore((state) => state.clearCart)

export const useCaptureCartSnapshot = (): (() => CartItemSnapshot[]) =>
  useCartStore((state) => state.captureCartSnapshot)

export const useRemoveCartSnapshot = (): ((
  snapshot: readonly CartItemSnapshot[],
) => void) => useCartStore((state) => state.removeCartSnapshot)
