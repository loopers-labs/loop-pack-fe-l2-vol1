import { identify, reset, track } from './logger'
import { setAnalyticsUser } from './context'

// 이벤트 이름과 프로퍼티를 정하는 유일한 자리다.
//
// 이름 규칙은 `<대상>_<행동>`, snake_case 다. 시드 로그(fixtures/events-30d.jsonl)의
// 이름을 그대로 쓴다. 계측 스키마는 혼자 정하는 것이 아니라 이미 합의된 것에 맞추는
// 편이 낫고, 이름이 같아야 3단계에서 시드 로그로 세운 순위를 우리 로그로 이어 볼 수 있다.
//
// 화면은 track() 을 직접 부르지 않고 아래 함수만 부른다. 컴포넌트가 문자열 이름을 들면
// 오타가 조용히 새 이벤트를 만들고, 프로퍼티가 화면마다 달라진다.
//
// ── 시드 스키마와 어긋나는 자리 (RFC 매핑 표에 그대로 옮긴다) ──────────────
// product_detail_view  이 코드베이스에 상세 화면이 없다. 계측하지 않는다.
// cart_add             시드는 quantity 를 갖는다. 우리 담기는 수량 없는 토글이라 1 로 보낸다.
//                      담기 해제에 해당하는 이름이 시드에 없어 해제는 보내지 않는다.
// wishlist_add         찜 해제도 같은 이유로 보내지 않는다.
// order_start          시드는 productId 하나다. 우리 주문서는 여러 상품이라
//                      productIds 와 itemCount 로 넓혔다.
// order_complete       시드는 totalPrice 를 갖는다. 스타터의 주문 응답에 금액이 없어
//                      계산할 수 없다. orderId 와 itemCount 로 대신한다.

export const trackProductListView = (props: {
  category: string
  sort: string
  page: number
}) => track('product_list_view', props)

export const trackCategoryFilterChange = (props: { category: string }) =>
  track('category_filter_change', props)

export const trackSortChange = (props: { sort: string }) =>
  track('sort_change', props)

export const trackPageChange = (props: { page: number }) =>
  track('page_change', props)

export const trackCartAdd = (props: { productId: string }) =>
  track('cart_add', { ...props, quantity: 1 })

export const trackWishlistAdd = (props: { productId: string }) =>
  track('wishlist_add', props)

// from 은 사용자가 어디에서 로그인 화면에 닿았는지다. 시드 로그도 같은 이름을 쓴다.
// 보호 경로에서 튕겨 왔는지, 만료로 돌아왔는지에 따라 고칠 화면이 다르다.
export const trackLoginStart = (props: { from: string }) =>
  track('login_start', props)

export const trackLoginSuccess = (props: { from: string }) =>
  track('login_success', props)

// reason 은 status 를 그대로 쓰지 않는다. 숫자를 로그에 남기면 집계할 때마다
// 다시 의미로 옮겨야 한다.
export const trackLoginFail = (props: { reason: string }) =>
  track('login_fail', props)

export const trackOrderStart = (props: {
  productIds: string[]
  itemCount: number
}) => track('order_start', props)

export const trackOrderComplete = (props: {
  orderId: string
  itemCount: number
}) => track('order_complete', props)

// 로그인·로그아웃에서 사용자 식별을 붙이고 뗀다. 두 동작을 한 자리에 두는 이유는,
// identify 만 부르고 reset 을 빼먹으면 로그아웃한 뒤의 이벤트가 앞사람 id 로 남기 때문이다.
export const identifyUser = (userId: string) => {
  setAnalyticsUser(userId)
  identify(userId)
}

export const resetUser = () => {
  setAnalyticsUser(null)
  reset()
}
