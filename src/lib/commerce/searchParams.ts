import { createParser, parseAsString, parseAsStringLiteral } from 'nuqs'
import type { CategoryId, ProductSort } from '@/types/commerce'

export const categoryFilterValues = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly (CategoryId | 'all')[]

export const sortFilterValues = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[]

export type CategoryFilter = (typeof categoryFilterValues)[number]

// page=0, 음수, 소수, 안전 정수 초과는 API가 400으로 거절하는 값이다.
// parser가 관문이 되어 잘못된 URL을 기본값 1로 되돌린다.
// isSafeInteger인 이유: isInteger는 1e20 같은 거대 수를 통과시키는데 API는 거절한다.
const parseAsPageNumber = createParser<number>({
  parse: (value) => {
    const page = Number(value)
    return Number.isSafeInteger(page) && page >= 1 ? page : null
  },
  serialize: (value) => String(value),
})

// 목록 조건의 원본은 URL이다. 기본값은 URL에서 생략되고 화면에서는 살아있다.
export const productListSearchParams = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(categoryFilterValues).withDefault('all'),
  sort: parseAsStringLiteral(sortFilterValues).withDefault('latest'),
  page: parseAsPageNumber.withDefault(1),
}

// 조건 변경마다 히스토리에 남겨 뒤로가기와 앞으로가기로 복원되게 한다.
export const productListUrlOptions = { history: 'push' as const }

export const PRODUCT_PAGE_SIZE = 12
