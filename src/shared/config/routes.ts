/**
 * 보호 경로의 단일 정의.
 *
 * 두 곳이 이 값을 읽는다. proxy(미들웨어)는 세션 쿠키가 없는 요청을 여기서 걸러 로그인으로 보내고,
 * apiClient 의 401 인터셉터는 "지금 보고 있는 화면이 보호 경로인가"로 만료 여부를 가른다.
 * 목록이 두 벌이면 한쪽만 늘어났을 때 가드는 걸리는데 만료 안내는 안 뜨는 식으로 조용히 어긋난다.
 */
export const PROTECTED_ROUTES = ['/order', '/orders', '/mypage'] as const;

/** 로그인 화면. 미로그인·만료 모두 이 경로로 보내고 reason 으로 사유를 구분한다. */
export const LOGIN_PATH = '/login';

/** 복원 경로를 실어 나르는 쿼리 파라미터 이름. */
export const RETURN_TO_PARAM = 'returnTo';

/** 로그인 화면이 안내 문구를 가르는 신호. required = 미로그인, expired = 세션 만료. */
export const AUTH_REASON_PARAM = 'reason';
export type AuthReason = 'required' | 'expired';

/**
 * 보호 경로 판정. 정확히 일치하거나 그 하위 경로면 보호 대상이다.
 * `/orders` 와 `/orders/123` 은 보호하고, `/ordersomething` 은 보호하지 않는다.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
