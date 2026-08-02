import { describe, expect, it } from 'vitest'
import { resolveTheme } from './theme'

describe('resolveTheme', () => {
  it('dark 쿠키만 dark 테마로 판정한다', () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it.each([undefined, 'light', 'system', 'invalid'])(
    '%s 쿠키는 light 테마로 복구한다',
    (cookieValue) => {
      expect(resolveTheme(cookieValue)).toBe('light')
    },
  )
})
