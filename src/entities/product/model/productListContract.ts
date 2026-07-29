import type { CategoryId, ProductSort } from './product'

// URL parser와 mock API route가 같은 허용값과 판정 규칙을 쓰게 하는 단일 원본이다.
// 두 처리의 책임은 다르다. 클라이언트 정규화는 잘못된 입력을 요청 전에 되돌려 불필요한 400
// 왕복을 줄이는 UX 처리이고, 서버 검증은 클라이언트를 신뢰하지 않는다는 전제로 반드시 한다.
// 책임은 나누되 기준까지 갈라지면 같은 URL이 화면과 API에서 다르게 판정된다.

// all은 서버에 없는 필터 전용 값이라 카테고리 ID와 분리한다.
export const categoryIds = [
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly CategoryId[]

export const categoryFilterValues = ['all', ...categoryIds] as const

export const sortValues = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[]

export type CategoryFilter = (typeof categoryFilterValues)[number]

// route가 허용하는 상한이다. 화면이 실제로 쓰는 기본값은 URL 계약 쪽에 둔다.
const MAX_PAGE_SIZE = 24

// isSafeInteger인 이유: isInteger는 1e20 같은 거대 수를 통과시키는데 API는 거절한다.
const isValidPage = (page: number) => Number.isSafeInteger(page) && page >= 1

export const isValidPageSize = (pageSize: number) =>
  Number.isSafeInteger(pageSize) && pageSize >= 1 && pageSize <= MAX_PAGE_SIZE

// 값뿐 아니라 표기까지 본다. Number()만 쓰면 '0x10', ' 1', '1e2'가 통과하고,
// 선행 0을 허용하면 '007'과 '7'이 같은 페이지의 다른 URL이 된다.
// 표기가 갈리는 만큼 query key도 갈려서 같은 목록이 여러 캐시 엔트리를 차지한다.
const parsePositiveIntegerValue = (
  raw: string,
  isValid: (value: number) => boolean,
) => {
  if (!/^[1-9]\d*$/.test(raw)) return null
  const value = Number(raw)
  return isValid(value) ? value : null
}

export const parsePageValue = (raw: string) =>
  parsePositiveIntegerValue(raw, isValidPage)

export const parsePageSizeValue = (raw: string) =>
  parsePositiveIntegerValue(raw, isValidPageSize)

export const isCategoryFilter = (value: string): value is CategoryFilter =>
  categoryFilterValues.some((category) => category === value)

export const isProductSort = (value: string): value is ProductSort =>
  sortValues.some((sort) => sort === value)
