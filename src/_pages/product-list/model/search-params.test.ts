import { describe, expect, it } from 'vitest'
import { productListParsers } from './search-params'

// 계획서 2번 (URL 조건 정규화) — docs/rfc/week08-test-plan.md
describe('productListParsers', () => {
  it.each(['0', '-1', 'not-a-number'])('유효하지 않은 page=%s를 첫 페이지로 정규화한다', (page) => {
    expect(productListParsers.page.parseServerSide(page)).toBe(1)
  })

  it('양의 정수 페이지는 그대로 사용한다', () => {
    expect(productListParsers.page.parseServerSide('3')).toBe(3)
  })

  it('지원하지 않는 카테고리와 정렬값을 기본값으로 정규화한다', () => {
    expect(productListParsers.category.parseServerSide('unknown')).toBe('all')
    expect(productListParsers.sort.parseServerSide('oldest')).toBe('latest')
  })
})
