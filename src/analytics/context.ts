import type { EventProperties } from './provider';

export type AnalyticsDevice = 'mobile' | 'tablet' | 'desktop';

const ANALYTICS_SESSION_STORAGE_KEY = 'aesthetic:analytics-session-id';

let currentUserId: string | null = null;
let inMemorySessionId: string | null = null;

function createSessionId(): string {
  return `s_${crypto.randomUUID()}`;
}

function getSessionId(): string {
  if (inMemorySessionId) return inMemorySessionId;

  const storedSessionId = sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY);
  if (storedSessionId) {
    inMemorySessionId = storedSessionId;
    return storedSessionId;
  }

  const sessionId = createSessionId();
  sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, sessionId);
  inMemorySessionId = sessionId;
  return sessionId;
}

function getDevice(): AnalyticsDevice {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function setAnalyticsUserId(userId: string | null): void {
  currentUserId = userId;
}

export function getAnalyticsCommonProperties(): EventProperties {
  return {
    sessionId: getSessionId(),
    ts: new Date().toISOString(),
    device: getDevice(),
    ...(currentUserId ? { userId: currentUserId } : {}),
  };
}

export function resetAnalyticsContextForTest(): void {
  currentUserId = null;
  inMemorySessionId = null;
}
