// 주문 응답 계약(클라 몫). 서버(app)의 타입은 features가 올려다볼 수 없어 여기서 정의한다.
export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};
