import { track } from "@/analytics/logger";

// 이벤트 이름·props의 단일 진실. 시드 스키마(fixtures/events-30d.jsonl)를 그대로 채택하되,
// 우리 앱 데이터로 답할 수 없는 prop은 제외한다. 이름이 시드와 다른 것은 없어 매핑 표가 필요 없다.
//
// prop 판정 기준: "이 이벤트로 무엇을 집계하나"(명세 💡)에 답할 수 있고, 우리 데이터로 채울 수 있으며,
// 다른 prop에서 파생되지 않는 것만 남긴다. 제외한 prop은 아래 각 줄에 근거를 남긴다.
//
// 시드 로그는 우리 앱이 아니라 그 스키마를 정의한 다른 앱의 기록이라, 우리 앱에 없는 화면의 이벤트도 있다.
// product_detail_view가 그 예다 — 시드 앱에는 상품 상세 화면이 있으나 우리 앱에는 목록만 있어,
// 찍을 화면이 없으므로 emit하지 않는다. 목록 조작(category_filter_change·sort_change·page_change)은
// 우리 목록 화면에 있어 넣는다.
export type EventMap = {
  // 시드 props 그대로. 목록 진입 시 어떤 조건으로 들어왔는지 집계한다.
  product_list_view: { category: string; sort: string; page: number };
  category_filter_change: { category: string };
  sort_change: { sort: string };
  page_change: { page: number };
  // 시드는 { productId, quantity }. quantity는 제외한다 — 우리 cart는 수량 개념이 없어(week-05 'id만',
  // 담기=클릭 1회) 항상 상수 1이라, "몇 개 담나" 질문에 답할 데이터가 없다(totalPrice를 제외한 것과 같은 이유다).
  cart_add: { productId: string };
  wishlist_add: { productId: string };
  // from: 어디서 로그인 화면으로 왔는지(복원 경로). 시드 값은 'cart'뿐이지만 우리는 redirect로 안다.
  login_start: { from: string };
  login_success: { from: string };
  // reason: 실패 사유. 시드는 'INVALID_CREDENTIALS'뿐. 우리 401 에러가 그 사유다.
  login_fail: { reason: string };
  // 시드는 단수 productId(단일상품 주문 모델). 우리는 다상품(cart)이라 productIds 배열로 매핑한다.
  order_start: { productIds: string[] };
  // totalPrice는 제외한다 — 우리 앱에 결제·쿠폰·배송 개념이 없어 시드의 '실제 결제액'에 답할 값이 없다.
  order_complete: { productIds: string[] };
};

// 뷰는 이 함수로 이름·props를 직접 호출한다(래퍼를 이벤트마다 두지 않는다 — 대부분 콜사이트가 하나뿐).
// 이름·props가 EventMap과 어긋나면 컴파일 에러라, 오타·스키마 drift를 도구가 막는다.
export function trackEvent<K extends keyof EventMap>(name: K, props: EventMap[K]): void {
  track(name, props);
}
