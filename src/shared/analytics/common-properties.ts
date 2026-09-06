import type { CommonProperties } from "./events";

const SESSION_STORAGE_KEY = "analytics.sessionId";

// 탭 하나가 한 세션이라 sessionStorage 에 둔다 (탭을 닫으면 끝난다).
// 시드 로그는 `s_` + 4자리지만 그 형식은 표기일 뿐이고, 이 값은 세션 집계의 키다 — 36진수 4자리(약 168만 개)는
// 두 사용자가 같은 값을 받아 세션이 하나로 합쳐질 수 있어 UUID 를 쓴다. 접두사만 시드와 맞춘다
const newSessionId = () => `s_${randomId()}`;

const randomId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

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
