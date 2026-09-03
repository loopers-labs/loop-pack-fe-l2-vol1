import { syncAnalyticsUser } from './currentUser';
import { EVENT, CART_ADD_QUANTITY } from './events';
import type { EventName, EventProps } from './events';
import { track } from './logger';

/**
 * 이벤트별 호출 함수.
 *
 * 화면 코드는 이벤트 이름도 프로퍼티 모양도 알지 못하고 이 함수만 부른다. 이름 규칙이나 프로퍼티가
 * 바뀌어도 고칠 곳이 이 파일 하나로 모인다.
 *
 * 무엇을 언제 보내는지는 `docs/rfc/week09-e2e-scope.md` A절에 있다.
 */

/**
 * 모든 이벤트가 지나는 자리.
 *
 * 보내기 직전에 프로바이더가 아는 사용자를 현재 세션에 맞춘다. 그래서 로그인한 채로
 * 새로고침하거나 세션이 만료된 경우처럼 로그인 함수를 거치지 않는 경로에서도, 그 이벤트가
 * 프로바이더에 닿기 전에 사용자 상태가 먼저 맞춰진다.
 */
function send<K extends EventName>(event: K, properties: EventProps[K]): void {
  syncAnalyticsUser();
  track(event, properties);
}

export function trackProductListView(condition: EventProps['product_list_view']): void {
  send(EVENT.PRODUCT_LIST_VIEW, condition);
}

export function trackCategoryFilterChange(
  category: EventProps['category_filter_change']['category'],
): void {
  send(EVENT.CATEGORY_FILTER_CHANGE, { category });
}

export function trackSortChange(sort: EventProps['sort_change']['sort']): void {
  send(EVENT.SORT_CHANGE, { sort });
}

export function trackPageChange(page: number): void {
  send(EVENT.PAGE_CHANGE, { page });
}

/** 담기지 않은 상태에서 담긴 상태로 바뀔 때만 부른다. 뺄 때는 남기는 이벤트가 없다 */
export function trackCartAdd(productId: string): void {
  send(EVENT.CART_ADD, { productId, quantity: CART_ADD_QUANTITY });
}

/** 찜하지 않은 상태에서 찜한 상태로 바뀔 때만 부른다 */
export function trackWishlistAdd(productId: string): void {
  send(EVENT.WISHLIST_ADD, { productId });
}

/** `from`은 로그인 후 돌아갈 경로다. 복원 경로와 같은 검증을 거친 값을 넘긴다 */
export function trackLoginStart(from: string): void {
  send(EVENT.LOGIN_START, { from });
}

/** 세션 캐시를 채운 뒤에 부른다. 그래야 이 이벤트에 `userId`가 실린다 */
export function trackLoginSuccess(from: string): void {
  send(EVENT.LOGIN_SUCCESS, { from });
}

/**
 * 로그인 실패.
 *
 * 이미 로그인한 사용자가 다른 계정으로 로그인하다 실패하면 그 사용자의 `userId`가 실린다.
 * `userId`는 "이 이벤트가 일어난 시점에 인증돼 있던 사용자"를 뜻하고, 실패한 자격 증명의
 * 주인을 가리키는 값이 아니다. 이벤트마다 예외를 두지 않는 이유는 A-3에 있다.
 */
export function trackLoginFail(reason: EventProps['login_fail']['reason']): void {
  send(EVENT.LOGIN_FAIL, { reason });
}

export function trackOrderStart(productIds: string[]): void {
  send(EVENT.ORDER_START, { productIds, itemCount: productIds.length });
}

export function trackOrderComplete(orderId: string, productIds: string[]): void {
  send(EVENT.ORDER_COMPLETE, { orderId, productIds, itemCount: productIds.length });
}

export { syncAnalyticsUser } from './currentUser';
