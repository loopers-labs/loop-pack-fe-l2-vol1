import { describe, expect, it } from 'vitest'
import { getPageNumbers } from './getPageNumbers'

describe('페이지 번호 계산', () => {
  it.each([
    {
      name: '첫 페이지에서는 음수 페이지를 만들지 않는다',
      page: 1,
      expected: [1, 2, 3],
    },
    {
      name: '중간 페이지에서는 현재 페이지 앞뒤 두 개를 표시한다',
      page: 5,
      expected: [3, 4, 5, 6, 7],
    },
    {
      name: '마지막 페이지에서는 총 페이지를 넘지 않는다',
      page: 10,
      expected: [8, 9, 10],
    },
  ])('$name', ({ page, expected }) => {
    expect(getPageNumbers(page, 100, 10)).toEqual({
      totalPages: 10,
      pageNumbers: expected,
    })
  })

  it('상품이 없어도 첫 페이지를 유효한 페이지로 유지한다', () => {
    expect(getPageNumbers(1, 0, 12)).toEqual({
      totalPages: 1,
      pageNumbers: [1],
    })
  })
})
