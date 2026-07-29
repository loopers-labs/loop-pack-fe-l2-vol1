import { create } from 'zustand'

// 위시리스트 capability의 전부다. 이 폴더를 지우는 것이 곧 기능 제거다.
// cart를 알지 않으므로 이 폴더를 지워도 장바구니 모델과 계약과 테스트는 그대로다.

interface WishlistState {
  wishlistIds: string[]
  toggleWishlist: (productId: string) => void
}

// cart에도 같은 모양의 함수가 있다. 공통으로 빼지 않는 근거는 RFC Decision 1에 있다.
const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]

const initialWishlistState = { wishlistIds: [] as string[] }

// 비로그인 익명 상태라 서버 원본이 없다. 판별에 필요한 상품 ID만 저장한다.
const useWishlistStore = create<WishlistState>((set) => ({
  ...initialWishlistState,
  toggleWishlist: (productId) =>
    set((state) => ({ wishlistIds: toggleId(state.wishlistIds, productId) })),
}))

export const useWishlistCount = () =>
  useWishlistStore((state) => state.wishlistIds.length)

export const useIsInWishlist = (productId: string) =>
  useWishlistStore((state) => state.wishlistIds.includes(productId))

export const useToggleWishlist = () =>
  useWishlistStore((state) => state.toggleWishlist)

export const resetWishlist = () =>
  useWishlistStore.setState(initialWishlistState)
