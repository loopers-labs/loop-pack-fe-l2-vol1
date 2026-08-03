import { PRODUCT_SORT_VALUES, productListQueryParsers, type ProductSort } from '@/entities/product'

// 정렬 라벨은 화면의 표현이라 여기서 정한다. 허용값 목록 자체는 entities가 소유하고,
// Record<ProductSort, string>이라 정렬이 하나 늘면 라벨 누락이 타입 에러로 잡힌다.
const SORT_LABELS: Record<ProductSort, string> = {
  'latest': '최신순',
  'popular': '인기순',
  'price-asc': '낮은 가격순',
  'price-desc': '높은 가격순',
}

// select가 그리는 옵션 목록. 순서는 entities의 허용값 순서를 그대로 따른다.
export const SORT_OPTIONS = PRODUCT_SORT_VALUES.map((value) => ({
  value,
  label: SORT_LABELS[value],
}))

// 카테고리·정렬·페이지처럼 "한 번의 명시적 변경"은 히스토리에 쌓아 뒤로/앞으로로 복원하게 한다.
// 히스토리 동작은 화면마다 다를 수 있어 parser 정의가 아니라 이 화면이 얹는다.
const PUSH_HISTORY = { history: 'push' } as const

// URL 상태의 단일 정의. useQueryStates(productListParsers)로 읽고 쓴다.
// parser 본체는 entities/product의 조회 스키마를 그대로 쓰므로
// URL 인코딩과 API 요청 직렬화가 갈라지지 않는다.
export const productListParsers = {
  // 검색어는 debounce가 끝난 확정값만 반영되므로 글자마다가 아니라 검색 단위로 히스토리에 쌓인다.
  q: productListQueryParsers.q.withOptions(PUSH_HISTORY),
  category: productListQueryParsers.category.withOptions(PUSH_HISTORY),
  sort: productListQueryParsers.sort.withOptions(PUSH_HISTORY),
  page: productListQueryParsers.page.withOptions(PUSH_HISTORY),
}
