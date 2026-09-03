import type { EventProperties } from './provider';

const SESSION_STORAGE_KEY = 'analytics_session_id';

const getSessionId = (): string => {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
};

const getDevice = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;

  if (width < 768) {
    return 'mobile';
  }
  if (width < 1024) {
    return 'tablet';
  }
  return 'desktop';
};

export const getCommonProperties = (): EventProperties => ({
  sessionId: getSessionId(),
  ts: new Date().toISOString(),
  device: getDevice(),
});
