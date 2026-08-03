import {
  createParser,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'
import type { CategoryId } from '@/entities/product/model/category'
import type { ProductSort } from '@/entities/product/model/product'

// 목록 조회가 허용하는 값 목록. 도메인 타입(CategoryId·ProductSort)과 함께 여기서만 정의한다.
export const PRODUCT_CATEGORY_FILTERS = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const satisfies readonly (CategoryId | 'all')[]

export const PRODUCT_SORT_VALUES = [
  'latest',
  'popular',
  'price-asc',
  'price-desc',
] as const satisfies readonly ProductSort[]

const parseAsPositiveInteger = createParser({
  parse: (value) => {
    const parsedValue = Number(value)

    return Number.isSafeInteger(parsedValue) && parsedValue >= 1 ? parsedValue : 1
  },
  serialize: String,
})

// 조회 파라미터의 단일 정의. 화면의 URL 상태와 API 요청 직렬화가 같은 parser에서 나온다.
// (parser를 두 벌 두면 인코딩 규칙이 갈라져 URL과 요청이 어긋난다.)
// 히스토리 동작처럼 화면에 따라 달라지는 옵션은 여기서 정하지 않고 소비하는 화면이 얹는다.
export const productListQueryParsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(PRODUCT_CATEGORY_FILTERS).withDefault('all'),
  sort: parseAsStringLiteral(PRODUCT_SORT_VALUES).withDefault('latest'),
  page: parseAsPositiveInteger.withDefault(1),
}

// pageSize는 URL 상태가 아니라 API 함수가 고정값으로 붙여 요청에만 싣는다.
const productListRequestParsers = {
  ...productListQueryParsers,
  pageSize: parseAsInteger,
}

// clearOnDefault: false → 기본값(sort=latest 등)도 항상 요청에 포함한다.
// URL 상태는 기본 동작을 써서 주소창을 깔끔하게 유지한다.
export const serializeProductListQuery = createSerializer(productListRequestParsers, {
  clearOnDefault: false,
})
