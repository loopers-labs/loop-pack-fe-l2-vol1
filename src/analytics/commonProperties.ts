import type { EventProperties } from './provider'

const SESSION_STORAGE_KEY = 'loopers.analytics.session-id'
const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1024
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let inMemorySessionId: string | null = null

export function getCommonAnalyticsProperties(): EventProperties {
  return {
    sessionId: getSessionId(),
    ts: new Date().toISOString(),
    device: getDevice(),
  }
}

function getSessionId(): string {
  if (inMemorySessionId !== null) {
    return inMemorySessionId
  }

  try {
    const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (storedSessionId !== null && UUID_V4_PATTERN.test(storedSessionId)) {
      inMemorySessionId = storedSessionId
      return storedSessionId
    }

    const newSessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId)
    inMemorySessionId = newSessionId
    return newSessionId
  } catch {
    inMemorySessionId = crypto.randomUUID()
    return inMemorySessionId
  }
}

function getDevice(): 'mobile' | 'tablet' | 'desktop' | null {
  if (typeof window === 'undefined' || typeof window.innerWidth !== 'number') {
    return null
  }

  if (window.innerWidth < TABLET_MIN_WIDTH) {
    return 'mobile'
  }

  if (window.innerWidth < DESKTOP_MIN_WIDTH) {
    return 'tablet'
  }

  return 'desktop'
}
