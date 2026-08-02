import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { THEME_COOKIE_KEY } from '@/shared/lib/theme'
import ThemeSelect from './ThemeSelect'

describe('ThemeSelect', () => {
  afterEach(() => {
    document.documentElement.dataset.theme = 'light'
    document.cookie = `${THEME_COOKIE_KEY}=; Path=/; Max-Age=0`
  })

  it('서버가 판정한 테마를 선택값으로 사용한다', () => {
    render(<ThemeSelect initialTheme="dark" />)

    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
  })

  it('선택한 테마를 문서와 쿠키에 함께 반영한다', () => {
    render(<ThemeSelect initialTheme="light" />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), {
      target: { value: 'dark' },
    })

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.cookie).toContain(`${THEME_COOKIE_KEY}=dark`)
  })
})
