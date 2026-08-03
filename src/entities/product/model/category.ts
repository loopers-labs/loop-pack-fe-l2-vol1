// 카테고리는 상품을 분류하고 조회 조건을 표현하는 값으로만 쓰인다. 전용 API·상태·화면이
// 없어 별도 entity로 분리하지 않고 product 슬라이스가 소유한다.
// 카테고리 전용 조회·상태·화면이 생기면 그때 별도 entity 분리를 재검토한다.
export type CategoryId = 'casual' | 'fashion' | 'goods' | 'home' | 'digital'

export type Category = {
  id: CategoryId
  name: string
}
