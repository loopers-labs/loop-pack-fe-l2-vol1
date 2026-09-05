import { create } from 'zustand'

// 장바구니 capability의 전부다. 규칙, 상태, action, 공개 selector, 격리용 reset이 여기 있다.
// wishlist를 알지 않으므로 위시리스트를 지울 때 이 파일은 열리지 않는다.
//
// store를 capability마다 따로 만드는 이유는 RFC Decision 1의 개정에 있다.
// 두 capability를 한 store에 조립하면 그 조립부가 entities보다 위에 있어야 하고,
// 같은 슬라이스의 토글 UI가 상위 레이어의 selector를 참조하는 역방향 의존이 된다.

interface CartState {
  cartIds: string[]
  toggleCart: (productId: string) => void
}

// 담기 규칙과 파생을 React 밖의 순수 함수로 둔다. store와 hook은 이것을 구독하는 배선일 뿐이라
// 규칙의 회귀는 DOM 없이 잡고, 배선의 회귀는 화면에서 잡는다.
//
// wishlist에도 같은 모양의 함수가 있다. 지금 공통으로 빼지 않는 이유는 RFC에 적었다.
// 중복이 작고, 두 행위의 토글 정책이 계속 같으리라는 근거가 아직 없다.

// 같은 상품을 다시 담으면 빠진다. 나머지는 담은 순서를 유지한다.
export const toggleCartId = (ids: readonly string[], productId: string) =>
  ids.includes(productId)
    ? ids.filter((existing) => existing !== productId)
    : [...ids, productId]

// 개수는 별도 상태가 아니라 담긴 ID 목록에서 파생한다.
// 개수를 따로 들면 목록과 어긋난 숫자가 헤더에 남는다.
export const cartCountOf = (ids: readonly string[]) => ids.length

export const isInCartIds = (ids: readonly string[], productId: string) =>
  ids.includes(productId)

const initialCartState = { cartIds: [] as string[] }

// 비로그인 익명 상태라 서버 원본이 없다. 원본은 이 store 하나다.
// 판별에 필요한 상품 ID만 저장한다. 개수와 포함 여부는 selector에서 파생하고,
// Product 전체를 복사하면 서버 캐시와 두 번째 원본이 생긴다.
const useCartStore = create<CartState>((set) => ({
  ...initialCartState,
  toggleCart: (productId) =>
    set((state) => ({ cartIds: toggleCartId(state.cartIds, productId) })),
}))

// 화면에는 store 자체가 아니라 용도별 selector 훅만 공개한다.
// 소비자가 실수로 전체 store를 구독하거나 임의의 필드에 의존하지 않게 하는 어댑터 경계다.
export const useCartCount = () =>
  useCartStore((state) => cartCountOf(state.cartIds))

// 담긴 목록 자체가 필요한 소비자를 위한 selector다. 개수만 보는 헤더와 달리
// 주문서는 무엇이 담겼는지 알아야 한다. store를 직접 열지 않고 여기서 한 겹 둔다.
export const useCartIds = () => useCartStore((state) => state.cartIds)

export const useIsInCart = (productId: string) =>
  useCartStore((state) => isInCartIds(state.cartIds, productId))

export const useToggleCart = () => useCartStore((state) => state.toggleCart)

// 테스트 격리처럼 React 밖에서 클라이언트 상태를 비울 때 쓰는 어댑터다.
// 로그인이 생기면 로그아웃 경로가 여기에 붙는다.
export const resetCart = () => useCartStore.setState(initialCartState)
