import type { CommonProperties } from "./events";

const SESSION_STORAGE_KEY = "analytics.sessionId";

// 시드 로그의 세션은 `s_` + 4자리다. 탭 하나가 한 세션이라 sessionStorage 에 둔다 (탭을 닫으면 끝난다)
const newSessionId = () => `s_${Math.random().toString(36).slice(2, 6).padEnd(4, "0")}`;

let memorySessionId: string | null = null;

export function getSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored !== null) {
      return stored;
    }
    const created = newSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    memorySessionId ??= newSessionId();
    return memorySessionId;
  }
}

const MOBILE_MAX_WIDTH = 767;
const TABLET_MAX_WIDTH = 1023;

// 시드의 device 분류(mobile · tablet · desktop)를 뷰포트 폭으로 정한다. null 은 만들지 않는다
export function getDevice(): CommonProperties["device"] {
  if (window.innerWidth <= MOBILE_MAX_WIDTH) {
    return "mobile";
  }
  if (window.innerWidth <= TABLET_MAX_WIDTH) {
    return "tablet";
  }
  return "desktop";
}

let currentUserId: string | null = null;

export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const getCurrentUserId = () => currentUserId;

// 이벤트 발생 시점에 평가된다 (logger 가 track() 마다 호출). userId 는 로그인한 뒤에만 붙는다 — 시드와 같다
export function getCommonProperties(): CommonProperties {
  return {
    sessionId: getSessionId(),
    device: getDevice(),
    ts: new Date().toISOString(),
    ...(currentUserId === null ? {} : { userId: currentUserId }),
  };
}
