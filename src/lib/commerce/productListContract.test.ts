import { describe, expect, it } from 'vitest'
import { categories } from '@/app/api/_data/commerce'
import {
  categoryFilterValues,
  categoryIds,
  isCategoryFilter,
  isProductSort,
  isValidPageSize,
  parsePageSizeValue,
  parsePageValue,
} from './productListContract'
import { PRODUCT_PAGE_SIZE } from './searchParams'

// 이 모듈의 존재 이유는 클라이언트 정규화와 서버 검증이 같은 기준을 쓰게 하는 것이다.
// 따라서 판정 규칙뿐 아니라 허용값이 mock 데이터와 어긋나지 않는지도 함께 고정한다.

describe('허용값', () => {
  it('카테고리 허용값이 mock API 데이터와 일치한다', () => {
    expect(categories.map((category) => category.id)).toEqual([...categoryIds])
  })

  it('필터 허용값은 카테고리 ID에 all을 더한 것이다', () => {
    expect([...categoryFilterValues]).toEqual(['all', ...categoryIds])
    expect(isCategoryFilter('all')).toBe(true)
    expect(isCategoryFilter('unknown')).toBe(false)
  })

  it('정렬 허용값 밖의 값은 거부한다', () => {
    expect(isProductSort('price-asc')).toBe(true)
    expect(isProductSort('cheapest')).toBe(false)
  })

  it('화면이 쓰는 기본 pageSize는 서버 상한 안에 있다', () => {
    expect(isValidPageSize(PRODUCT_PAGE_SIZE)).toBe(true)
  })
})

describe('parsePageValue', () => {
  it('1 이상의 정수 표기만 통과시킨다', () => {
    expect(parsePageValue('1')).toBe(1)
    expect(parsePageValue('37')).toBe(37)
  })

  it('0, 음수, 소수, 문자는 거부한다', () => {
    expect(parsePageValue('0')).toBeNull()
    expect(parsePageValue('-2')).toBeNull()
    expect(parsePageValue('1.5')).toBeNull()
    expect(parsePageValue('abc')).toBeNull()
    expect(parsePageValue('')).toBeNull()
  })

  it('안전 정수를 벗어난 거대 수를 거부한다', () => {
    expect(parsePageValue('9'.repeat(400))).toBeNull()
  })

  it('같은 페이지를 가리키는 다른 표기를 거부한다', () => {
    // Number()만 보면 통과하는 값들이다. 통과시키면 한 페이지가 여러 URL과 query key로 갈린다.
    expect(parsePageValue('0x10')).toBeNull()
    expect(parsePageValue('1e2')).toBeNull()
    expect(parsePageValue(' 1')).toBeNull()
    expect(parsePageValue('+1')).toBeNull()
  })
})

describe('parsePageSizeValue', () => {
  it('1 이상 상한 이하만 통과시킨다', () => {
    expect(parsePageSizeValue('12')).toBe(12)
    expect(parsePageSizeValue('24')).toBe(24)
    expect(parsePageSizeValue('25')).toBeNull()
    expect(parsePageSizeValue('0')).toBeNull()
  })
})
