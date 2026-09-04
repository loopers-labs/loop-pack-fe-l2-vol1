// 주문 도메인 타입. 서버 라우트(src/app/api)도 여기서 가져다 써 정의를 한 벌로 유지한다.
export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
};
