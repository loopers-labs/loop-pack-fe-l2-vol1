// 인증·주문 API 계약 (9주차 스타터 `app/api/_data/auth.ts`에서 옮김).
// 화면 코드는 여기서만 타입을 가져온다 — mock 백엔드 모듈(node:crypto)을 import하지 않는다.

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthScenario = 'invalid' | 'expired' | 'error' | 'slow';

export type AuthErrorResponse = {
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderCreateRequest = {
  items: OrderItem[];
};

export type OrderCreateResponse = {
  order: Order;
};

export type OrderListResponse = {
  orders: Order[];
};
