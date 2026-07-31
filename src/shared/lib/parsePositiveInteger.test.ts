import { describe, expect, it } from 'vitest'
import { parsePositiveInteger } from './parsePositiveInteger'

describe('parsePositiveInteger', () => {
  it.each(['0', '-1', '1.5', '1e2', '0x10', ' 1', '01'])(
    '정규형이 아닌 양의 정수 %s를 거절한다',
    (raw) => {
      expect(parsePositiveInteger(raw)).toBeNull()
    },
  )

  it('안전한 양의 정수를 반환한다', () => {
    expect(parsePositiveInteger('7')).toBe(7)
  })

  it('상한을 넘는 값을 거절한다', () => {
    expect(parsePositiveInteger('25', { max: 24 })).toBeNull()
  })
})
