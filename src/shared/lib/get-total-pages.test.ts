import { describe, expect, it } from 'vitest'
import { getTotalPages } from './get-total-pages'

// 계획서 3번 — docs/rfc/week08-test-plan.md
describe('getTotalPages', () => {
  it.each([
    { totalCount: 0, pageSize: 12, expected: 1 },
    { totalCount: 24, pageSize: 12, expected: 2 },
    { totalCount: 11, pageSize: 12, expected: 1 },
    { totalCount: 13, pageSize: 12, expected: 2 },
  ])(
    '상품 $totalCount개를 페이지당 $pageSize개로 나누면 $expected페이지다',
    ({ totalCount, pageSize, expected }) => {
      expect(getTotalPages(totalCount, pageSize)).toBe(expected)
    },
  )
})
