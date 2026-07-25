import { describe, expect, it } from 'vitest'
import { productListSearchParams } from './searchParams'

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
