export const THEME_COOKIE_KEY = 'commerce-theme'

export type Theme = 'light' | 'dark'

export const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark'

export const resolveTheme = (value: string | undefined): Theme =>
  value === 'dark' ? 'dark' : 'light'

export const themeFromCookie = (cookie: string): Theme => {
  const value = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${THEME_COOKIE_KEY}=`))
    ?.slice(THEME_COOKIE_KEY.length + 1)

  return resolveTheme(value)
}
