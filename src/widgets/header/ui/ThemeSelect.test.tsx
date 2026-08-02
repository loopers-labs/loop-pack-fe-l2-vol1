import { fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { THEME_COOKIE_KEY } from '@/shared/lib/theme'
import ThemeSelect from './ThemeSelect'

describe('ThemeSelect', () => {
  afterEach(() => {
    document.documentElement.dataset.theme = 'light'
    document.cookie = `${THEME_COOKIE_KEY}=; Path=/; Max-Age=0`
  })

  it('서버 최초 마크업은 쿠키와 무관하게 light로 고정한다', () => {
    document.cookie = `${THEME_COOKIE_KEY}=dark; Path=/`

    const markup = renderToStaticMarkup(<ThemeSelect />)

    expect(markup).toContain('<option value="light" selected="">Light</option>')
    expect(markup).not.toContain('<option value="dark" selected="">')
  })

  it('hydration 이후 쿠키 테마를 선택값과 문서에 함께 적용한다', () => {
    document.cookie = `${THEME_COOKIE_KEY}=dark; Path=/`

    render(<ThemeSelect />)

    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('선택한 테마를 문서와 쿠키에 함께 반영한다', () => {
    render(<ThemeSelect />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Theme' }), {
      target: { value: 'dark' },
    })

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.cookie).toContain(`${THEME_COOKIE_KEY}=dark`)
  })
})
