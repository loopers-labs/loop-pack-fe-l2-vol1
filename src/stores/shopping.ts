import { create } from 'zustand'

interface ShoppingState {
  cartIds: string[]
  wishlistIds: string[]
  toggleCart: (productId: string) => void
  toggleWishlist: (productId: string) => void
}

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]

// 비로그인 익명 상태라 서버 원본이 없다. 원본은 이 store 하나다.
// 판별에 필요한 상품 ID만 저장한다. 개수와 포함 여부는 selector에서 파생하고,
// Product 전체를 복사하면 서버 캐시와 두 번째 원본이 생긴다.
export const useShoppingStore = create<ShoppingState>((set) => ({
  cartIds: [],
  wishlistIds: [],
  toggleCart: (productId) =>
    set((state) => ({ cartIds: toggleId(state.cartIds, productId) })),
  toggleWishlist: (productId) =>
    set((state) => ({ wishlistIds: toggleId(state.wishlistIds, productId) })),
}))
