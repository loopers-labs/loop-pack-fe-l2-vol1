// 05-step2-design.md 3절 — 이름·props 스키마의 단일 출처. 화면은 이 파일의 함수만 부르고
// logger.track()을 직접 부르지 않는다. 이 모듈을 import하면 './setup'이 함께 평가되어
// 어떤 화면이 먼저 이벤트를 보내든 공통 프로퍼티 등록이 이미 끝나 있다.
import './setup';
import { track } from './logger';

export function trackProductListView(props: { category: string; sort: string; page: number }): void {
  track('product_list_view', props);
}

export function trackCategoryFilterChange(category: string): void {
  track('category_filter_change', { category });
}

export function trackSortChange(sort: string): void {
  track('sort_change', { sort });
}

export function trackPageChange(page: number): void {
  track('page_change', { page });
}

export function trackCartAdd(productId: string): void {
  track('cart_add', { productId, quantity: 1 });
}

export function trackCartRemove(productId: string): void {
  track('cart_remove', { productId });
}

export function trackWishlistAdd(productId: string): void {
  track('wishlist_add', { productId });
}

export function trackWishlistRemove(productId: string): void {
  track('wishlist_remove', { productId });
}

export function trackLoginStart(from: string | null): void {
  track('login_start', { from });
}

export function trackLoginSuccess(params: { from: string | null; userId: string }): void {
  track('login_success', { from: params.from, userId: params.userId });
}

// 05-step2-design.md 확정 4번 — 시드는 INVALID_CREDENTIALS 하나뿐이지만, 3단계에서
// "무엇을 실패로 셌는지" 밝히려면 원인을 세분해야 뭉치지 않고 나중에 골라 셀 수 있다.
export type LoginFailReason = 'INVALID_CREDENTIALS' | 'BAD_REQUEST' | 'SERVER_ERROR' | 'NETWORK_ERROR';

export function trackLoginFail(reason: LoginFailReason): void {
  track('login_fail', { reason });
}

export function trackOrderStart(params: { productIds: string[]; userId: string }): void {
  track('order_start', { productIds: params.productIds, userId: params.userId });
}

export function trackOrderComplete(params: { productIds: string[]; totalPrice: number; userId: string }): void {
  track('order_complete', { productIds: params.productIds, totalPrice: params.totalPrice, userId: params.userId });
}

export function trackSessionExpired(from: string): void {
  track('session_expired', { from });
}

export function trackClientError(params: { code: string; productId: string }): void {
  track('client_error', params);
}
