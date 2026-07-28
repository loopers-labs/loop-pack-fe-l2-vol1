import { createSerializer, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs/server'
import type { CategoryId, ProductSort } from '@/types/commerce'

const CATEGORY_FILTERS = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly (CategoryId | 'all')[]

// 정렬 옵션의 단일 정의. parser의 허용값과 화면의 select 목록이 여기서 함께 나온다.
// (값 목록을 parser와 컴포넌트에 각각 두면 옵션 추가 시 한쪽만 고치는 사고가 난다.)
export const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '낮은 가격순' },
  { value: 'price-desc', label: '높은 가격순' },
] as const satisfies readonly { value: ProductSort; label: string }[]

const SORT_VALUES = SORT_OPTIONS.map(({ value }) => value)

// 화면에 페이지 크기 변경 UI가 없으므로 URL 상태가 아니라 고정 상수다.
// URL에 두면 사용자가 임의 값을 넣어 API 400을 만들 수 있는 표면만 늘어난다.
export const PRODUCT_PAGE_SIZE = 12

// 카테고리·정렬·페이지처럼 "한 번의 명시적 변경"은 히스토리에 쌓아 뒤로/앞으로로 복원하게 한다.
// serializer(API 직렬화)는 history 옵션을 쓰지 않으므로 영향 없다.
const PUSH_HISTORY = { history: 'push' } as const

// URL 상태의 단일 정의. useQueryStates(productListParsers)로 읽고 쓴다.
export const productListParsers = {
  // 검색어는 debounce가 끝난 확정값만 반영되므로 글자마다가 아니라 검색 단위로 히스토리에 쌓인다.
  q: parseAsString.withDefault('').withOptions(PUSH_HISTORY),
  category: parseAsStringLiteral(CATEGORY_FILTERS).withDefault('all').withOptions(PUSH_HISTORY),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault('latest').withOptions(PUSH_HISTORY),
  page: parseAsInteger.withDefault(1).withOptions(PUSH_HISTORY),
}

// API 요청은 URL 상태 + 고정 pageSize로 만든다.
const productListRequestParsers = {
  ...productListParsers,
  pageSize: parseAsInteger.withDefault(PRODUCT_PAGE_SIZE),
}

// clearOnDefault: false → 기본값(sort=latest 등)도 항상 요청에 포함한다. URL 상태는 기본 동작을 써서 주소창을 깔끔하게 유지한다.
export const serializeProductListQuery = createSerializer(productListRequestParsers, {
  clearOnDefault: false,
})
