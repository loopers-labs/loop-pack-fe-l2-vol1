// 주문 API의 계약. 응답에는 상품명·이미지·금액이 없고 productId와 수량만 온다
// (app/api/_data/auth.ts). 금액을 보여주려면 상품 데이터에서 따로 붙여야 한다.
export type OrderItem = {
  productId: string
  quantity: number
}

export type Order = {
  id: string
  createdAt: string
  items: OrderItem[]
}
