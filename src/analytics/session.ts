/**
 * 공통 프로퍼티 중 브라우저에서 읽어야 하는 두 값.
 *
 * 서버 렌더 중에는 `window`가 없다. 그때는 값을 만들지 않고 비워 둔다 — 계측은 브라우저에서만
 * 일어나므로 서버에서 만든 값이 로그에 실릴 일이 없다.
 */

const SESSION_ID_KEY = 'ANALYTICS_SESSION_ID';

/** 시드 로그의 `s_0141` 형식을 따라 접두사를 맞춘다 */
const SESSION_ID_PREFIX = 's_';

export type Device = 'mobile' | 'tablet' | 'desktop';

/** 앱의 그리드 열 수가 바뀌는 지점과 같은 값 (`layout.css`) */
const TABLET_MIN_WIDTH = 720;
const DESKTOP_MIN_WIDTH = 960;

/**
 * 탭 단위 세션 식별자를 읽고, 없으면 만든다.
 *
 * `sessionStorage`에 두어 탭이 살아 있는 동안 유지되고 탭을 닫으면 사라진다. 한 탭에서 로그인부터
 * 주문까지 이어지는 흐름을 한 세션으로 보기 위한 경계다.
 */
export function readOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const stored = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      return stored;
    }

    const created = `${SESSION_ID_PREFIX}${createRandomId()}`;
    window.sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    // 저장소를 쓸 수 없는 환경(프라이빗 모드 등)에서는 이번 로드 동안만 쓰는 값을 돌려준다.
    // 세션이 요청마다 갈라지지만 계측이 화면 동작을 막지는 않는다.
    return `${SESSION_ID_PREFIX}${createRandomId()}`;
  }
}

/**
 * 계측 시점의 viewport 너비로 구분한다.
 *
 * 실제 기기 종류를 판정하지 않는다. 창을 줄인 데스크톱은 `mobile`로 잡히는데, 기기를 특정하는
 * 값이 아니라 화면이 어떤 폭으로 보였는지를 남기는 값이다.
 */
export function readDevice(): Device | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const width = window.innerWidth;
  if (width < TABLET_MIN_WIDTH) {
    return 'mobile';
  }
  return width < DESKTOP_MIN_WIDTH ? 'tablet' : 'desktop';
}

const RANDOM_ID_RADIX = 36;
const RANDOM_ID_START = 2;
const RANDOM_ID_LENGTH = 10;

function createRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(RANDOM_ID_RADIX).slice(RANDOM_ID_START, RANDOM_ID_LENGTH);
}
