import { track } from '@/analytics/logger';

/**
 * 도메인 행위 하나에 이벤트 하나.
 *
 * 화면과 훅은 track() 을 직접 부르지 않고 이 함수들만 부른다. 이유가 둘이다.
 * 이벤트 이름 문자열이 이 파일에만 있어 오타가 한 곳에서만 가능하고,
 * 어떤 props 를 실어야 하는지가 타입으로 강제된다 — 화면마다 제각각 채우면
 * 3단계에서 집계할 때 같은 이벤트인데 프로퍼티가 다른 줄들이 섞인다.
 *
 * 이 파일이 계측의 "한 겹"이다. 과제가 "컴포넌트가 track() 을 직접 부르는 게 맞는지, 아니면
 * 한 겹 두는 게 맞는지 판단하라"고 한 부분이고, 두기로 한 이유가 위 두 줄이다.
 *
 * 이름은 시드 로그(fixtures/events-30d.jsonl)의 13종을 그대로 쓴다. props 는 두 곳에서
 * 다르며 그 차이는 RFC A절 매핑표에 적는다.
 * - cart_add 의 quantity: 장바구니가 수량을 갖지 않아 항상 1 이다.
 * - order_* 의 productId(단수)·totalPrice: 시드 로그는 상세에서 상품 하나를 바로 주문하는
 *   모델이고 우리는 장바구니를 일괄 주문한다. productIds 배열과 itemCount 로 바꿨고,
 *   가격은 장바구니가 갖고 있지 않아 싣지 않는다.
 *
 * client_error 는 붙이지 않는다. 화면 진입이나 도메인 행위가 아니라 오류 신호라
 * 3단계 노이즈 필터 기준과 얽힌다 — 그 사실도 RFC 에 적는다.
 */

/** 로그인 화면에 오게 된 경로. 시드 로그의 from 에 대응한다. */
export type LoginEntryPoint = 'order' | 'orders' | 'mypage' | 'direct';

export const trackProductListView = (props: { category: string; sort: string; page: number }) =>
  track('product_list_view', props);

export const trackProductDetailView = (productId: string) => track('product_detail_view', { productId });

export const trackCategoryFilterChange = (category: string) => track('category_filter_change', { category });

export const trackSortChange = (sort: string) => track('sort_change', { sort });

export const trackPageChange = (page: number) => track('page_change', { page });

export const trackCartAdd = (productId: string) => track('cart_add', { productId, quantity: 1 });

export const trackWishlistAdd = (productId: string) => track('wishlist_add', { productId });

export const trackLoginStart = (from: LoginEntryPoint) => track('login_start', { from });

export const trackLoginSuccess = (from: LoginEntryPoint) => track('login_success', { from });

/** 시드 로그가 문구가 아니라 코드값을 쓰므로 상태를 코드로 옮겨 싣는다. */
export const trackLoginFail = (reason: string) => track('login_fail', { reason });

export const trackOrderStart = (productIds: string[]) =>
  track('order_start', { productIds, itemCount: productIds.length });

export const trackOrderComplete = (props: { orderId: string; productIds: string[] }) =>
  track('order_complete', { ...props, itemCount: props.productIds.length });
