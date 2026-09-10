// 이벤트 스키마의 단일 출처. 이름은 시드 로그(fixtures/events-30d.jsonl)의 스키마를 그대로 따른다:
// snake_case, `<대상>_<행위>`. 팀이 이미 합의한 이름에 맞추는 것이 목적이라 새 이름을 만들지 않는다.
// 프로퍼티가 시드와 다른 곳은 docs/rfc/week09-e2e-scope.md A절 매핑 표에 적는다
export type AnalyticsEvents = {
  product_list_view: {
    category: string;
    sort: string;
    page: number;
    hasQuery: boolean;
  };
  cart_add: {
    productId: string;
    quantity: number;
  };
  login_start: {
    from: LoginFrom;
  };
  login_success: {
    from: LoginFrom;
  };
  login_fail: {
    from: LoginFrom;
    reason: "INVALID_CREDENTIALS" | "SERVER_ERROR" | "NETWORK";
  };
  order_start: {
    productIds: string[];
    itemCount: number;
  };
  order_complete: {
    orderId: string;
    productIds: string[];
    itemCount: number;
    totalPrice: number;
  };
};

export type AnalyticsEventName = keyof AnalyticsEvents;

// 로그인 화면에 어디서 왔는가. 복원 경로(next)의 첫 세그먼트로 정한다
export type LoginFrom = "cart" | "orders" | "mypage" | "direct";

export type CommonProperties = {
  sessionId: string;
  device: "mobile" | "tablet" | "desktop";
  ts: string;
  userId?: string;
};
