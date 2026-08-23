import { create } from 'zustand'

// 위시리스트 capability의 전부다. 이 폴더를 지우는 것이 곧 기능 제거다.
// cart를 알지 않으므로 이 폴더를 지워도 장바구니 모델과 계약과 테스트는 그대로다.

interface WishlistState {
  wishlistIds: string[]
  toggleWishlist: (productId: string) => void
}

// 찜 규칙과 파생을 React 밖의 순수 함수로 둔다. cart에도 같은 모양의 함수가 있고,
// 공통으로 빼지 않는 근거는 RFC Decision 1에 있다.

// 같은 상품을 다시 누르면 빠진다. 나머지는 찜한 순서를 유지한다.
export const toggleWishlistId = (ids: readonly string[], productId: string) =>
  ids.includes(productId)
    ? ids.filter((existing) => existing !== productId)
    : [...ids, productId]

// 개수는 별도 상태가 아니라 찜한 ID 목록에서 파생한다.
export const wishlistCountOf = (ids: readonly string[]) => ids.length

export const isInWishlistIds = (ids: readonly string[], productId: string) =>
  ids.includes(productId)

const initialWishlistState = { wishlistIds: [] as string[] }

// 비로그인 익명 상태라 서버 원본이 없다. 판별에 필요한 상품 ID만 저장한다.
const useWishlistStore = create<WishlistState>((set) => ({
  ...initialWishlistState,
  toggleWishlist: (productId) =>
    set((state) => ({
      wishlistIds: toggleWishlistId(state.wishlistIds, productId),
    })),
}))

export const useWishlistCount = () =>
  useWishlistStore((state) => wishlistCountOf(state.wishlistIds))

export const useIsInWishlist = (productId: string) =>
  useWishlistStore((state) => isInWishlistIds(state.wishlistIds, productId))

export const useToggleWishlist = () =>
  useWishlistStore((state) => state.toggleWishlist)

export const resetWishlist = () =>
  useWishlistStore.setState(initialWishlistState)
