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
    const storedSessionId =
      globalThis.sessionStorage?.getItem(SESSION_STORAGE_KEY)
    if (storedSessionId !== null && UUID_V4_PATTERN.test(storedSessionId)) {
      inMemorySessionId = storedSessionId
      return storedSessionId
    }
  } catch {
    // Storage can be blocked in private or embedded browser contexts.
  }

  const newSessionId = createSessionId()
  try {
    globalThis.sessionStorage?.setItem(SESSION_STORAGE_KEY, newSessionId)
  } catch {
    // Keep the page-lifetime fallback when storage cannot be written.
  }
  inMemorySessionId = newSessionId
  return newSessionId
}

function createSessionId(): string {
  try {
    const sessionId = globalThis.crypto?.randomUUID()
    if (sessionId !== undefined && UUID_V4_PATTERN.test(sessionId)) {
      return sessionId
    }
  } catch {
    // Use the non-PII fallback when secure browser randomness is unavailable.
  }

  return createFallbackUuidV4()
}

function createFallbackUuidV4(): string {
  const randomHex = (length: number): string =>
    Array.from({ length }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')

  const variant = (8 + Math.floor(Math.random() * 4)).toString(16)
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${variant}${randomHex(3)}-${randomHex(12)}`
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
