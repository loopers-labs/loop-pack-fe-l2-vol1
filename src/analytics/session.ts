// 05-step2-design.md 2-b — 세션은 브라우저 탭(컨텍스트) 생존 기간이다.
// sessionStorage에 두면 탭 생존 기간과 정확히 일치한다(새로고침 유지, 탭 닫으면 소멸).
const SESSION_ID_KEY = 'analytics.sessionId';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  const existing = sessionStorage.getItem(SESSION_ID_KEY);
  if (existing !== null) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_KEY, id);
  return id;
}
