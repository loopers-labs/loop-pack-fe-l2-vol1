/**
 * 주문 도메인 타입.
 *
 * 세션 타입과 같은 이유로 app 레이어에서 내려왔다. 주문 응답에는 금액이 없고
 * 상품 id는 형식만 검증되므로(`p1`~`p30`), 화면에 금액을 보이려면 상품 데이터에서
 * 따로 계산해야 한다.
 */

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

/**
 * 최근 주문이 위로 오도록 뒤집는다.
 *
 * 서버는 새 주문을 목록 뒤에 덧붙이므로 받은 순서가 곧 시간순이다. `createdAt`으로 정렬하지 않는
 * 이유는 같은 분에 여러 건이 들어오면 표시되는 시각이 같아 순서가 흔들리기 때문이다.
 */
export function toRecentFirst(orders: Order[]): Order[] {
  return [...orders].reverse();
}
