import { create } from 'zustand'

interface ShoppingState {
  cartIds: string[]
  wishlistIds: string[]
  toggleCart: (productId: string) => void
  toggleWishlist: (productId: string) => void
}

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]

const initialShoppingState = {
  cartIds: [] as string[],
  wishlistIds: [] as string[],
}

// 비로그인 익명 상태라 서버 원본이 없다. 원본은 이 store 하나다.
// 판별에 필요한 상품 ID만 저장한다. 개수와 포함 여부는 selector에서 파생하고,
// Product 전체를 복사하면 서버 캐시와 두 번째 원본이 생긴다.
const useShoppingStore = create<ShoppingState>((set) => ({
  ...initialShoppingState,
  toggleCart: (productId) =>
    set((state) => ({ cartIds: toggleId(state.cartIds, productId) })),
  toggleWishlist: (productId) =>
    set((state) => ({ wishlistIds: toggleId(state.wishlistIds, productId) })),
}))

// 화면에는 store 자체가 아니라 용도별 selector 훅만 공개한다.
// 소비자가 실수로 전체 store를 구독하거나 임의의 필드에 의존하지 않게 하는 어댑터 경계다.
export const useCartCount = () =>
  useShoppingStore((state) => state.cartIds.length)

export const useWishlistCount = () =>
  useShoppingStore((state) => state.wishlistIds.length)

export const useIsInCart = (productId: string) =>
  useShoppingStore((state) => state.cartIds.includes(productId))

export const useIsInWishlist = (productId: string) =>
  useShoppingStore((state) => state.wishlistIds.includes(productId))

export const useToggleCart = () => useShoppingStore((state) => state.toggleCart)

export const useToggleWishlist = () =>
  useShoppingStore((state) => state.toggleWishlist)

// 로그아웃·테스트 격리처럼 React 밖에서 세션 상태를 폐기할 때 쓰는 명시적 어댑터다.
export const resetShoppingState = () =>
  useShoppingStore.setState(initialShoppingState)
