import { identify, reset, track } from '@/analytics/logger';

// 이벤트 스키마 — 팀이 합의한 외부 계약(시드 로그 `docs/fixtures/events.md`와 같은 이름·props).
// 화면 코드는 `track('문자열')`을 직접 부르지 않고 여기 함수만 부른다 (RFC A절):
// 이름 오타·props 누락을 타입이 막고, 스키마가 바뀌면 이 파일만 고친다.
//
// shared에 두는 이유: 이벤트 이름은 도메인이지만 목록이 8개뿐이고 도메인 코드가 아니라
// "다른 팀(데이터)과의 계약"이라 한 파일이 맞다. 슬라이스별로 흩으면 계약이 흩어진다.

export type ListViewProperties = {
  category: string;
  sort: string;
  page: number;
};

export type LoginFailReason = 'INVALID_CREDENTIALS' | 'SERVER_ERROR';

export const analyticsEvents = {
  productListView: (properties: ListViewProperties) =>
    track('product_list_view', properties),

  cartAdd: (productId: string) => track('cart_add', { productId, quantity: 1 }),

  loginStart: (from: string) => track('login_start', { from }),

  // 로그인 성공 = 이벤트 + 사용자 식별. 둘을 한 자리에서 부르게 묶어 둔다.
  loginSuccess: (userId: string, from: string) => {
    track('login_success', { from });
    identify(userId);
  },

  loginFail: (reason: LoginFailReason) => track('login_fail', { reason }),

  orderStart: (itemCount: number) => track('order_start', { itemCount }),

  orderComplete: (orderId: string, itemCount: number) =>
    track('order_complete', { orderId, itemCount }),

  // 로그아웃 = 사용자 식별 해제. 세션에서 파생된 것만 정리한다 (RFC D6).
  logout: () => reset(),
};
