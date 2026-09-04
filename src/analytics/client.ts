import { consoleProvider } from './consoleProvider'
import { initAnalytics, registerProviders, setCommonProperties } from './logger'

const SESSION_ID_KEY = 'commerce-analytics-session-id'

export function createAnalyticsSessionId(): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
  return `s_${uuid}`
}

export function readAnalyticsDevice(): 'mobile' | 'tablet' | 'desktop' | null {
  if (typeof window === 'undefined') {
    return null
  }
  const width = window.innerWidth
  if (width < 768) {
    return 'mobile'
  }
  if (width < 1024) {
    return 'tablet'
  }
  return 'desktop'
}

function resolveSessionId(): string {
  if (typeof window === 'undefined') {
    return createAnalyticsSessionId()
  }
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY)
    if (existing !== null) {
      return existing
    }
    const created = createAnalyticsSessionId()
    window.sessionStorage.setItem(SESSION_ID_KEY, created)
    return created
  } catch {
    return createAnalyticsSessionId()
  }
}

const sessionId = resolveSessionId()

registerProviders([consoleProvider])
setCommonProperties(() => ({
  sessionId,
  ts: new Date().toISOString(),
  device: readAnalyticsDevice(),
}))

if (typeof window !== 'undefined') {
  void initAnalytics()
}
