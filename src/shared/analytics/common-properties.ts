export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const MOBILE_MAX_WIDTH = 767;
const TABLET_MAX_WIDTH = 1023;

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width <= MOBILE_MAX_WIDTH) return 'mobile';
  if (width <= TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

const SESSION_ID_STORAGE_KEY = 'analytics-session-id';

// 브라우저 탭 하나가 곧 하나의 방문 세션이라고 본다. 탭을 닫으면 사라지고
// 새로 열면 새로 생성된다 — 로그인 여부와 무관한, entities/session(인증
// 세션)과는 다른 개념이다.
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, id);
  return id;
}

// setCommonProperties()에 등록할 함수. logger.ts가 이벤트 발생 시점마다
// 다시 호출하므로, 매번 최신 device를 반영한다.
export function getCommonProperties() {
  return {
    sessionId: getSessionId(),
    device: getDeviceType(),
    ts: new Date().toISOString(),
  };
}
