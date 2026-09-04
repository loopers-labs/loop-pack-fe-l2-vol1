// 주문 응답 계약. 금액은 서버가 주지 않는다 — 표시용 금액은 상품 데이터에서 계산한다.
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
