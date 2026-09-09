/**
 * 로그인 후 돌아갈 경로를 검증한다.
 *
 * 미로그인으로 보호 경로에 들어오면 proxy가 원래 경로를 `next`에 실어 로그인으로 보낸다.
 * 그 값은 주소창에서 온 것이라 그대로 믿고 이동하면 외부 주소로 튕겨나간다.
 *
 * 통과 조건 세 가지 —
 * 1. `/`로 시작한다. 절대 URL(`https://example.com`)을 막는다.
 * 2. `//` 또는 `/\`로 시작하지 않는다. `//example.com`은 protocol-relative URL이라 앞의
 *    `/` 하나만 보고 통과시키면 브라우저가 외부 절대 주소로 해석한다. 브라우저는 URL을
 *    해석할 때 `\`를 `/`처럼 다루므로 `/\example.com`도 같은 결과가 된다.
 * 3. 로그인 경로로 되돌아가지 않는다. 로그인 후 다시 로그인 화면으로 가면 루프가 된다.
 *
 * 하나라도 어기면 홈으로 떨어뜨린다. 값을 고쳐서 살려내지 않는다 — 조작된 값을 보정하면
 * 무엇을 막았는지 로그에도 남지 않는다.
 */

export const DEFAULT_REDIRECT_PATH = '/';

export const LOGIN_PATH = '/login';

/**
 * 복원 경로를 실어 나르는 쿼리 파라미터.
 *
 * proxy(Edge)가 쓰고 로그인 페이지(Node)가 읽으므로 shared에 둔다. app에 두면 proxy가
 * 참조할 수 없다 — Edge 경계상 proxy는 shared만 볼 수 있다.
 */
export const REDIRECT_PARAM = 'next';

/** 만료 때문에 되돌려진 진입인지 표시한다. 로그인 화면의 안내 문구가 갈린다 */
export const EXPIRED_PARAM = 'expired';

/**
 * 만료를 뜻하는 값. 생성 측과 해석 측이 같은 상수를 쓴다.
 *
 * 파라미터의 존재만으로 판정하면 `?expired=0`처럼 사람이 주소를 고쳐 넣은 값에도
 * 만료 안내가 뜬다. 보안 경계는 아니지만 사실과 다른 안내가 남는다.
 */
export const EXPIRED_FLAG = '1';

/** 로그인 화면이 만료 안내를 띄울지 판정한다 */
export function isExpiredFlag(value: string | null | undefined): boolean {
  return value === EXPIRED_FLAG;
}

/**
 * 브라우저가 URL을 해석하기 전에 떼어내는 앞쪽 공백·제어문자.
 * `\n/example.com` 같은 값이 검사를 우회하지 못하도록 같은 기준으로 먼저 정리한다.
 */
const LEADING_BLANK_PATTERN = /^[\u0000-\u0020]+/;

/** `//example.com` `/\example.com` — 호스트로 해석될 수 있는 시작 형태 */
const PROTOCOL_RELATIVE_PATTERN = /^\/[/\\]/;

/**
 * @param candidate 검증할 경로. `next` 파라미터에서 읽은 값이라 없을 수도 있다
 * @returns 그대로 이동해도 되는 내부 경로. 조건을 어기면 홈 경로
 */
export function safeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate) {
    return DEFAULT_REDIRECT_PATH;
  }

  const trimmed = candidate.replace(LEADING_BLANK_PATTERN, '');

  if (!trimmed.startsWith('/')) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (PROTOCOL_RELATIVE_PATTERN.test(trimmed)) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (isLoginPath(trimmed)) {
    return DEFAULT_REDIRECT_PATH;
  }

  return trimmed;
}

/**
 * 로그인으로 되돌릴 때 쓸 경로를 만든다.
 *
 * proxy(Edge)·보호 페이지(서버)·전역 401 처리기(클라이언트) 세 곳이 같은 일을 하므로 한 곳에
 * 둔다. 나뉘어 있으면 파라미터 이름이나 검증 여부가 한쪽에서만 바뀌어도 알아채기 어렵다.
 *
 * @param target 돌아갈 경로. 검증을 통과하지 못하면 홈으로 대체된다
 * @param expired 만료 때문에 되돌리는 것인지. 로그인 화면의 안내 문구가 갈린다
 */
export function buildLoginPath(target: string, expired: boolean): string {
  const params = new URLSearchParams();
  params.set(REDIRECT_PARAM, safeRedirectPath(target));
  if (expired) {
    params.set(EXPIRED_PARAM, EXPIRED_FLAG);
  }

  return `${LOGIN_PATH}?${params.toString()}`;
}

/** `/login` 자신과 그 하위 경로를 가른다. `/loginable` 같은 다른 경로는 통과시킨다 */
function isLoginPath(path: string): boolean {
  if (path === LOGIN_PATH) {
    return true;
  }

  return ['/', '?', '#'].some((separator) => path.startsWith(`${LOGIN_PATH}${separator}`));
}
