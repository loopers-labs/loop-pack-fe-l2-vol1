export const THEME_COOKIE_KEY = 'commerce-theme'

export type Theme = 'light' | 'dark'

export const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark'

export const resolveTheme = (value: string | undefined): Theme =>
  value === 'dark' ? 'dark' : 'light'
