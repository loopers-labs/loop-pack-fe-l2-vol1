/**
 * 세션 쿠키 이름과 수명. 값만 담고 의존을 갖지 않는다.
 *
 * proxy(Edge)와 API 라우트(Node)가 같은 이름을 봐야 하는데, `node:crypto`를 쓰는
 * `src/app/api/_data/auth.ts`에 함께 두면 상수 하나를 가져와도 crypto가 Edge 번들에
 * 끌려 들어간다. `next build`는 경고만 내고 통과하지만 실행에서 500이 난다.
 *
 * shared에 두면 proxy·entities·features·app이 모두 아래 방향으로만 참조하게 되어
 * FSD 레이어 규칙과 런타임 경계가 같은 방향을 가리킨다.
 */

export const SESSION_COOKIE = 'session';

export const SCENARIO_COOKIE = 'scenario';

const SECONDS_PER_HOUR = 60 * 60;

export const SESSION_TTL_SECONDS = SECONDS_PER_HOUR;

const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/**
 * 세션 쿠키의 수명. 토큰 수명보다 하루 길다.
 *
 * 둘을 같게 두면 토큰이 죽는 순간 브라우저가 쿠키도 버려서, 서버는 "만료된 사람"과
 * "로그인한 적 없는 사람"을 구분할 수 없다. 만료 안내가 필요한 자리에서 안내 없이
 * 로그인 화면만 뜬다.
 *
 * 하루로 잡은 이유 — 만료 안내가 필요한 상황은 쓰던 중 끊긴 사람이 다시 시도할 때이고,
 * 그 재시도는 대개 같은 날 안에 일어난다. 하루를 넘겨 돌아온 사람에게는 안내보다 새
 * 로그인 화면이 자연스럽다. exp가 지난 토큰은 어떤 권한도 주지 못하므로 남겨 두는
 * 비용은 요청당 몇십 바이트와 서명 검증 한 번뿐이다.
 *
 * 그래서 서버가 만료를 판정할 수 있는 구간은 토큰이 죽은 뒤 하루까지다. 그 뒤에는
 * 쿠키도 사라져 다시 anonymous가 되고 안내 없이 로그인 화면이 뜬다.
 */
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_TTL_SECONDS + SECONDS_PER_DAY;

/**
 * 세션 조회를 신선하다고 볼 기간.
 *
 * 세션 수명과 같게 두면 그 사이 세션이 끊겨도 화면이 로그인 상태로 남는다. 짧게 잡아
 * 다시 확인할 자격을 만든다. 첫 진입에는 서버가 심은 값이 방금 만들어진 것이라 요청이
 * 나가지 않으므로, cold load의 waterfall은 그대로다.
 */
export const SESSION_STALE_TIME_MS = 60 * 1000;
