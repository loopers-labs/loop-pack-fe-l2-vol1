import type { EventProperties } from './provider'

const SESSION_ID_KEY = 'commerce.analytics.session-id'
const FLOW_ID_KEY = 'commerce.analytics.flow-id'

let currentUserId: string | null = null

const getStoredId = (key: string): string | null => window.sessionStorage.getItem(key)

const createStoredId = (key: string): string => {
  const id = crypto.randomUUID()
  window.sessionStorage.setItem(key, id)
  return id
}

export const getSessionId = (): string =>
  getStoredId(SESSION_ID_KEY) ?? createStoredId(SESSION_ID_KEY)

export const getOrCreateFlowId = (): string =>
  getStoredId(FLOW_ID_KEY) ?? createStoredId(FLOW_ID_KEY)

export const getFlowId = (): string | undefined => getStoredId(FLOW_ID_KEY) ?? undefined

export const clearFlowId = (): void => window.sessionStorage.removeItem(FLOW_ID_KEY)

export const setAnalyticsUserId = (userId: string | null): void => {
  currentUserId = userId
}

export const getCommonEventProperties = (): EventProperties => ({
  sessionId: getSessionId(),
  device: 'desktop',
  ts: new Date().toISOString(),
  ...(currentUserId === null ? {} : { userId: currentUserId }),
})
