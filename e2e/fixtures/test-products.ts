// E2E가 쓰는 시드 상품. 이름이 카드 제목·담기 버튼의 접근 가능한 이름·장바구니 행 제목
// 세 자리에 들어가므로 한 곳에서만 정한다(docs/rfc/week09-e2e-scope.md의 유지보수 비용 추정).
export type TestProduct = {
  id: string
  name: string
  category: string
}

export const CART_TEST_PRODUCT: TestProduct = {
  id: 'p21',
  name: '메이커스 투명케이스',
  category: 'digital',
}

// 카테고리로 좁혀 첫 페이지에서 찾는다. 정렬 기본값과 페이지 크기에 기대지 않으려면
// 목록 자체를 좁히는 편이 낫다.
export const productListPath = (product: TestProduct): string =>
  `/products?category=${product.category}`
