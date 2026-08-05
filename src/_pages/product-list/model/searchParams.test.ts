import { describe, expect, it } from 'vitest'
import {
  hasNonDefaultFilters,
  PRODUCT_PAGE_SIZE,
  productListScenarioSearchParams,
  productListSearchParams,
} from './searchParams'

// parser는 잘못된 URL이 API 계약을 벗어나지 않게 막는 관문이다.
// parse가 null을 돌려주면 nuqs가 기본값을 쓴다.

describe('page parser', () => {
  it('1 이상의 정수만 통과시킨다', () => {
    expect(productListSearchParams.page.parse('1')).toBe(1)
    expect(productListSearchParams.page.parse('37')).toBe(37)
  })

  it('0, 음수, 소수, 문자는 거부해 기본값으로 되돌린다', () => {
    expect(productListSearchParams.page.parse('0')).toBeNull()
    expect(productListSearchParams.page.parse('-2')).toBeNull()
    expect(productListSearchParams.page.parse('1.5')).toBeNull()
    expect(productListSearchParams.page.parse('abc')).toBeNull()
    expect(productListSearchParams.page.defaultValue).toBe(1)
  })

  it('안전 정수를 벗어난 거대 수도 거부한다. API가 400으로 거절하는 값이다', () => {
    expect(
      productListSearchParams.page.parse('99999999999999999999'),
    ).toBeNull()
  })
})

describe('q parser', () => {
  it('앞뒤 공백을 잘라 같은 검색어가 하나의 조건이 되게 한다', () => {
    expect(productListSearchParams.q.parse('  니트  ')).toBe('니트')
    expect(productListSearchParams.q.parse('니트')).toBe('니트')
  })

  it('공백뿐인 검색어는 조건이 아니라 기본값과 같아진다', () => {
    expect(productListSearchParams.q.parse('   ')).toBe('')
    expect(productListSearchParams.q.defaultValue).toBe('')
  })
})

describe('category, sort parser', () => {
  it('지원 목록 밖의 값은 거부한다', () => {
    expect(productListSearchParams.category.parse('unknown')).toBeNull()
    expect(productListSearchParams.sort.parse('cheapest')).toBeNull()
  })

  it('기본값은 과제 계약과 같다. category=all, sort=latest, page=1', () => {
    expect(productListSearchParams.category.defaultValue).toBe('all')
    expect(productListSearchParams.sort.defaultValue).toBe('latest')
    expect(productListSearchParams.page.defaultValue).toBe(1)
  })
})

describe('scenario parser', () => {
  it('starter가 정의한 세 값을 통과시킨다', () => {
    expect(productListScenarioSearchParams.scenario.parse('slow')).toBe('slow')
    expect(productListScenarioSearchParams.scenario.parse('empty')).toBe(
      'empty',
    )
    expect(productListScenarioSearchParams.scenario.parse('error')).toBe(
      'error',
    )
  })

  it('지원하지 않는 값은 요청 조건으로 쓰지 않는다', () => {
    // URL에서 지운다는 뜻이 아니다. 주소창의 문자열은 남을 수 있고,
    // 조건으로 읽히지 않아 평소 응답을 그대로 쓴다는 뜻이다.
    expect(productListScenarioSearchParams.scenario.parse('xxx')).toBeNull()
    expect(productListScenarioSearchParams.scenario.parse('SLOW')).toBeNull()
  })

  it('기본값을 두지 않아 URL에 없으면 조건이 없다', () => {
    // 기본값이 생기면 URL에 없어도 매 요청에 재현 조건이 붙는다.
    expect(productListScenarioSearchParams.scenario).not.toHaveProperty(
      'defaultValue',
    )
  })

  it('필터 그룹과 분리되어 초기화 판정에 들어가지 않는다', () => {
    // 같은 그룹이면 setFilters(null)이 재현 조건까지 지운다.
    expect(productListSearchParams).not.toHaveProperty('scenario')
    expect(
      hasNonDefaultFilters({ q: '', category: 'all', sort: 'latest', page: 1 }),
    ).toBe(false)
  })
})

describe('화면 기본값', () => {
  it('화면이 쓰는 pageSize는 양의 정수다', () => {
    expect(Number.isSafeInteger(PRODUCT_PAGE_SIZE)).toBe(true)
    expect(PRODUCT_PAGE_SIZE).toBeGreaterThan(0)
  })
})
