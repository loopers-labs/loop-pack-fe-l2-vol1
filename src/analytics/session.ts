import type { EventProperties } from "@/analytics/provider";

// 모든 이벤트에 붙는 공통 프로퍼티(sessionId·device·ts·userId)를 만든다.
// setCommonProperties에 이 getter를 넘기면 track마다 발화 시점에 평가돼 병합된다.
//
// 이 파일은 스타터 로거를 수정하지 않고 그 위에 얹는다. window 접근은 전부 함수 안(발화 시점 CSR)이라
// 모듈 로드(SSR)에서 실행되지 않는다.

const SESSION_ID_KEY = "analytics_session_id";

// 브라우저 세션당 안정적인 익명 식별자. 로그인과 무관하다(브라우저 세션 ≠ 인증 세션) —
// 로그아웃해도 유지되고, 탭을 닫으면(sessionStorage 소멸) 새 세션이 된다.
function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  sessionStorage.setItem(SESSION_ID_KEY, created);
  return created;
}

// 화면 폭으로 기기를 가른다. 시드의 mobile·tablet·desktop 구분과 같은 축이다.
function getDevice(): "mobile" | "tablet" | "desktop" {
  if (window.matchMedia("(max-width: 767px)").matches) {
    return "mobile";
  }
  if (window.matchMedia("(max-width: 1023px)").matches) {
    return "tablet";
  }
  return "desktop";
}

// userId의 진실은 React state(useSession)에 있어 모듈 스코프 getter가 읽지 못한다.
// providers의 세션 감시 effect가 로그인 상태 변화(로그인·새로고침 재수화·만료·로그아웃)마다
// 이 값을 갱신해, 공통 프로퍼티가 React 밖에서 userId를 읽게 한다. 전이가 아니라 상태 관측이라
// 이벤트를 안 거치는 경로(새로고침)에서도 값이 낡지 않는다.
let currentUserId: string | null = null;

export function setAnalyticsUser(userId: string | null): void {
  currentUserId = userId;
}

// track마다 평가되는 공통 프로퍼티. 로그인 상태면 userId를 더한다.
export function getCommonProperties(): EventProperties {
  const base: EventProperties = {
    sessionId: getSessionId(),
    device: getDevice(),
    ts: new Date().toISOString(),
  };
  return currentUserId === null ? base : { ...base, userId: currentUserId };
}
