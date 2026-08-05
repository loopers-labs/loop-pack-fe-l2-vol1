import { createParser, parseAsStringLiteral, type inferParserType } from 'nuqs'
import { productListScenarioValues } from '@/_pages/product-list/api/productList'
import {
  categoryIds,
  sortValues,
} from '@/entities/product/model/productListContract'
import { parsePositiveInteger } from '@/shared/lib/parsePositiveInteger'

// `all`은 상품 카테고리가 아니라 목록 화면의 필터 표현이다.
export const categoryFilterValues = ['all', ...categoryIds] as const
export type CategoryFilter = (typeof categoryFilterValues)[number]

// page=0, 음수, 소수, 안전 정수 초과는 API가 400으로 거절하는 값이다.
// parser가 관문이 되어 잘못된 URL을 기본값 1로 되돌린다. 판정 규칙은 route와 공유한다.
// 앞뒤 공백은 조건이 아니다. 폼은 제출할 때 잘라내지만 주소창 입력과 뒤로가기는
// 폼을 거치지 않아서, 같은 검색어가 공백 유무로 다른 query key를 만들 수 있었다.
// 정규화 관문을 page와 같은 자리인 parser로 모은다.
const parseAsSearchQuery = createParser<string>({
  parse: (value) => value.trim(),
  serialize: (value) => value.trim(),
})

const parseAsPageNumber = createParser<number>({
  parse: parsePositiveInteger,
  serialize: (value) => String(value),
})

// 목록 조건의 원본은 URL이다. 기본값은 URL에서 생략되고 화면에서는 살아있다.
export const productListSearchParams = {
  q: parseAsSearchQuery.withDefault(''),
  category: parseAsStringLiteral(categoryFilterValues).withDefault('all'),
  sort: parseAsStringLiteral(sortValues).withDefault('latest'),
  page: parseAsPageNumber.withDefault(1),
}

export type ProductListFilters = inferParserType<typeof productListSearchParams>

// 재현 조건은 사용자 필터와 다른 그룹에 둔다. 같은 그룹이면 setFilters(null) 초기화가
// 필터를 지울 때 재현 조건까지 함께 지운다. 그룹을 나누면 초기화의 사정권 밖에 남는다.
// 기본값을 두지 않아 URL에 없으면 null이고, 지원하지 않는 값도 null로 읽는다.
// 이때 주소창의 문자열은 그대로 남을 수 있다. 지우는 것이 아니라 요청 조건으로 쓰지 않는다.
export const productListScenarioSearchParams = {
  scenario: parseAsStringLiteral(productListScenarioValues),
}

// 기본값의 원본은 parser다. 화면이 기본값을 다시 적으면 두 곳이 갈린다.
// 조건이 이미 기본값이면 초기화해도 URL과 query key가 그대로여서 아무 일도 일어나지 않는다.
export const hasNonDefaultFilters = (filters: ProductListFilters) =>
  filters.q !== productListSearchParams.q.defaultValue ||
  filters.category !== productListSearchParams.category.defaultValue ||
  filters.sort !== productListSearchParams.sort.defaultValue ||
  filters.page !== productListSearchParams.page.defaultValue

// 조건 변경마다 히스토리에 남겨 뒤로가기와 앞으로가기로 복원되게 한다.
export const productListUrlOptions = { history: 'push' as const }

export const PRODUCT_PAGE_SIZE = 12
