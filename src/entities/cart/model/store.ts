import { create } from 'zustand'

// 비로그인 로컬 장바구니. id만 저장한다(서버 Product 복사 금지). 개수·담김여부는 파생한다.
interface CartState {
  cartIds: string[]
  toggleCart: (id: string) => void
  clearCart: () => void
}

const toggle = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]

// store 인스턴스는 모듈 밖으로 내보내지 않는다 — 외부는 selector 훅만 알면 된다.
const useCartStore = create<CartState>((set) => ({
  cartIds: [],
  toggleCart: (id) => set((state) => ({ cartIds: toggle(state.cartIds, id) })),
  clearCart: () => set({ cartIds: [] }),
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
