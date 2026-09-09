import type { CategoryId } from '@/entities/category/model/category';
import type { ProductSort } from '@/entities/product/model/product';

/**
 * 이벤트 이름과 프로퍼티 계약.
 *
 * 이름은 시드 로그(`fixtures/events-30d.jsonl`)의 것을 그대로 쓴다. 기존 로그와 같은 행동을 같은
 * 이름으로 집계하기 위해서다. 문자열이 화면 코드에 흩어지면 오타가 나도 빌드는 통과하고 로그가
 * 쌓인 뒤에야 드러나므로, 이 파일 밖에서는 문자열을 직접 쓰지 않는다.
 *
 * 계약의 근거는 `docs/rfc/week09-e2e-scope.md` A절에 있다.
 */

export const EVENT = {
  PRODUCT_LIST_VIEW: 'product_list_view',
  CATEGORY_FILTER_CHANGE: 'category_filter_change',
  SORT_CHANGE: 'sort_change',
  PAGE_CHANGE: 'page_change',
  CART_ADD: 'cart_add',
  WISHLIST_ADD: 'wishlist_add',
  LOGIN_START: 'login_start',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAIL: 'login_fail',
  ORDER_START: 'order_start',
  ORDER_COMPLETE: 'order_complete',
} as const;

export type EventName = (typeof EVENT)[keyof typeof EVENT];

/**
 * 로그인 실패 사유.
 *
 * 화면에는 사유를 나눠 보여주지 않는다(가입된 이메일이 드러나므로). 그것과 별개로 로그에는
 * 실제 사유를 남긴다. 서버 오류나 네트워크 실패를 자격 증명 불일치로 적으면 나중에 로그를 읽는
 * 사람이 잘못된 결론에 이른다.
 */
export const LOGIN_FAIL_REASON = {
  /** 자격 증명 불일치. 서버가 401로 답한 경우만 */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** 서버가 실패로 답한 나머지 */
  SERVER_ERROR: 'SERVER_ERROR',
  /** 응답을 받지 못한 경우 */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** 응답은 받았으나 다룰 수 없는 실패 — 본문 파싱 실패나 예상하지 못한 오류 */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type LoginFailReason = (typeof LOGIN_FAIL_REASON)[keyof typeof LOGIN_FAIL_REASON];

/** 담기에 수량 개념이 없어 항상 1이다 */
export const CART_ADD_QUANTITY = 1;

/** 이벤트별 프로퍼티. 시드 로그와 다른 곳은 A-5에 정리돼 있다 */
export type EventProps = {
  [EVENT.PRODUCT_LIST_VIEW]: { category: CategoryId | 'all'; sort: ProductSort; page: number };
  [EVENT.CATEGORY_FILTER_CHANGE]: { category: CategoryId | 'all' };
  [EVENT.SORT_CHANGE]: { sort: ProductSort };
  [EVENT.PAGE_CHANGE]: { page: number };
  [EVENT.CART_ADD]: { productId: string; quantity: typeof CART_ADD_QUANTITY };
  [EVENT.WISHLIST_ADD]: { productId: string };
  [EVENT.LOGIN_START]: { from: string };
  [EVENT.LOGIN_SUCCESS]: { from: string };
  [EVENT.LOGIN_FAIL]: { reason: LoginFailReason };
  [EVENT.ORDER_START]: { productIds: string[]; itemCount: number };
  [EVENT.ORDER_COMPLETE]: { orderId: string; productIds: string[]; itemCount: number };
};
