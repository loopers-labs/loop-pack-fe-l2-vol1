'use client'

import { useState } from 'react'
import { isTheme, THEME_COOKIE_KEY, type Theme } from '@/shared/lib/theme'

interface ThemeSelectProps {
  initialTheme: Theme
}

export default function ThemeSelect({ initialTheme }: ThemeSelectProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

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
