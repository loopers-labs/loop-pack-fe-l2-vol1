import type { CategoryId, ProductSort } from "@/entities/product";

// ── 이벤트 이름 규칙 ────────────────────────────────────────────────────────
// `<대상>_<행동>`, 소문자 snake_case, 대상은 단수. 시드 로그가 이미 이 규칙이라
// 새로 만들지 않고 맞춘다 — 계측 스키마는 혼자 정하는 게 아니라 팀이 합의한 것이다.
//
// 행동은 **과거형이 아닌 사실**로 쓴다(`view`·`add`·`start`·`complete`·`fail`).
// `button_click` 같은 이름을 쓰지 않는 이유는 3단계에서 이 로그로 경로를 세기
// 때문이다. 클릭을 한 이름에 담으면 그때 아무것도 셀 수 없다.
export const EVENT = {
  productListView: "product_list_view",
  categoryFilterChange: "category_filter_change",
  sortChange: "sort_change",
  pageChange: "page_change",
  cartAdd: "cart_add",
  wishlistAdd: "wishlist_add",
  loginStart: "login_start",
  loginSuccess: "login_success",
  loginFail: "login_fail",
  orderStart: "order_start",
  orderComplete: "order_complete",
} as const;

// 이 앱에 화면이 없어서 보내지 않는 이벤트. 시드 로그에는 있다.
//   product_detail_view — 상세 화면이 없다. 목록에서 바로 주문서로 간다.
//   client_error        — 오류 계측은 이번 범위 밖이다(에러 경계는 7·8주차에 세웠다).
// 빠진 사실을 3단계 RFC A절에 적는다. 없는 화면을 만들지는 않는다.
export const NOT_SENT = ["product_detail_view", "client_error"] as const;

// ── 이벤트별 프로퍼티 ───────────────────────────────────────────────────────
// 시드 로그의 props와 키·타입을 맞춘다. 매핑 표는 RFC A절에 있다.
export type EventProps = {
  [EVENT.productListView]: { category: CategoryId | "all"; sort: ProductSort; page: number };
  [EVENT.categoryFilterChange]: { category: CategoryId | "all" };
  [EVENT.sortChange]: { sort: ProductSort };
  [EVENT.pageChange]: { page: number };
  [EVENT.cartAdd]: { productId: string; quantity: number };
  [EVENT.wishlistAdd]: { productId: string };
  [EVENT.loginStart]: { from: string };
  [EVENT.loginSuccess]: { from: string };
  [EVENT.loginFail]: { reason: string };
  [EVENT.orderStart]: { productId: string };
  [EVENT.orderComplete]: { productId: string; totalPrice: number };
};

export type EventName = keyof EventProps;
