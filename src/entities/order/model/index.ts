// [AI] Order 도메인 타입의 소유자(entities/order). 스타터가 app/api/_data/auth.ts에
// 둔 응답 타입을 화면 쪽에서 안전하게 쓰도록 entities로 옮겨 소유한다
// (week-09 과제: "응답 타입은 본인 구조에 맞는 곳으로 옮겨도 된다").
// _data/auth.ts는 node:crypto를 쓰므로 클라이언트 코드가 직접 import하지 않는다.
export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrderListResponse = {
  orders: Order[];
};
