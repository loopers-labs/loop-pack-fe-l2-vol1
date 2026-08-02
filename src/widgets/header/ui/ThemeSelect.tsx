'use client'

import { useEffect, useState } from 'react'
import {
  isTheme,
  THEME_COOKIE_KEY,
  themeFromCookie,
  type Theme,
} from '@/shared/lib/theme'

export default function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const storedTheme = themeFromCookie(document.cookie)

    setTheme(storedTheme)
    document.documentElement.dataset.theme = storedTheme
  }, [])

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = event.target.value

    if (!isTheme(nextTheme)) {
      return
    }

    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    document.cookie = `${THEME_COOKIE_KEY}=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`
  }

  return (
    <label className="theme-select">
      <span>Theme</span>
      <select value={theme} onChange={handleThemeChange}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}
