export const LOGIN_PATH = '/login';

export type LoginReason = 'expired';

/**
 * 로그인이 필요한 모든 진입점이 같은 규칙으로 돌아갈 경로를 next에 싣는다.
 * 만료는 reason으로 구분해 로그인 화면이 안내를 띄운다.
 */
export function buildLoginUrl(next: string, reason?: LoginReason) {
  const params = new URLSearchParams({
    next,
    ...(reason ? { reason } : {}),
  });

  return `${LOGIN_PATH}?${params}`;
}

const VALIDATION_ORIGIN = 'https://app.invalid';

/**
 * next는 URL에 노출돼 누구나 바꿀 수 있다. 같은 origin 경로만 허용하고 나머지는 홈으로 보낸다.
 */
export function toSafeNextPath(next: string | null | undefined) {
  if (!next?.startsWith('/')) return '/';

  try {
    const url = new URL(next, VALIDATION_ORIGIN);
    const path = `${url.pathname}${url.search}${url.hash}`;

    return url.origin === VALIDATION_ORIGIN && !path.startsWith('//')
      ? path
      : '/';
  } catch {
    return '/';
  }
}
