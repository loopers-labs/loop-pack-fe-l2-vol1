import { create } from 'zustand'

// 비로그인 로컬 위시리스트. id만 저장한다. cart와 분리된 독립 store(도메인이 다르다).
interface WishlistState {
  wishIds: string[]
  toggleWish: (id: string) => void
  clearWishlist: () => void
}

const toggle = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]

const useWishlistStore = create<WishlistState>((set) => ({
  wishIds: [],
  toggleWish: (id) => set((state) => ({ wishIds: toggle(state.wishIds, id) })),
  clearWishlist: () => set({ wishIds: [] }),
}))

export const useIsWished = (id: string): boolean =>
  useWishlistStore((state) => state.wishIds.includes(id))

export const useWishCount = (): number =>
  useWishlistStore((state) => state.wishIds.length)

export const useToggleWish = (): ((id: string) => void) =>
  useWishlistStore((state) => state.toggleWish)

export const useClearWishlist = (): (() => void) =>
  useWishlistStore((state) => state.clearWishlist)
