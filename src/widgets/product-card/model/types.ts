// widget 카드가 실제로 그리는 필드만 받는다. 응답 DTO(Product)를 그대로 받으면 카드가 쓰지 않는
// sizes·rating·createdAt의 변경까지 영향권에 들어온다. 구조적 타이핑 덕에 Product도 그대로 들어온다.
export type ProductCardItem = {
  id: string
  image: string
  name: string
  brand: string
  price: number
}
