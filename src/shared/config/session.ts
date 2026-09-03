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
