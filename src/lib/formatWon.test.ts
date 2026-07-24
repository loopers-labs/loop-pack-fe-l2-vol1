import { describe, expect, it } from 'vitest'
import { formatWon } from './formatWon'

describe('formatWon', () => {
  it('천 단위 구분자와 원 접미사를 붙인다', () => {
    expect(formatWon(38800)).toBe('38,800원')
  })

  it('0원도 표기한다', () => {
    expect(formatWon(0)).toBe('0원')
  })

  it('백만 단위도 로케일 그룹핑된다', () => {
    expect(formatWon(1234567)).toBe('1,234,567원')
  })
})
