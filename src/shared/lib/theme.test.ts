import { describe, expect, it } from 'vitest'
import { resolveTheme, themeFromCookie } from './theme'

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

describe('themeFromCookie', () => {
  it('다른 쿠키와 순서가 섞여도 commerce theme만 읽는다', () => {
    expect(themeFromCookie('session=abc; commerce-theme=dark; locale=ko')).toBe(
      'dark',
    )
  })

  it.each(['', 'commerce-theme=', 'commerce-theme=system', 'theme=dark'])(
    '유효한 테마가 없는 %s 쿠키는 light로 복구한다',
    (cookie) => {
      expect(themeFromCookie(cookie)).toBe('light')
    },
  )
})
