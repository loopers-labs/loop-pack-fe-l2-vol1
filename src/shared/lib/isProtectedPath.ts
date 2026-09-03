import { PROTECTED_ROUTES } from '@/shared/config/routes';

/**
 * 보호 경로 판정. 정확히 일치하거나 그 하위 경로면 보호 대상이다.
 * `/orders` 와 `/orders/123` 은 보호하고, `/ordersomething` 은 보호하지 않는다.
 *
 * 두 곳이 이 판정을 쓴다. proxy 는 세션 쿠키가 없는 요청을 걸러 로그인으로 보내고,
 * apiClient 의 401 인터셉터는 "지금 보고 있는 화면이 보호 경로인가"로 만료 여부를 가른다.
 * 판정이 틀리면 한쪽은 보호 화면이 그냥 열리고 다른 쪽은 만료 안내가 사라진다.
 *
 * 목록(PROTECTED_ROUTES)은 config 에, 판정은 여기에 둔다 — 옆의 isSafeRedirect 와 같은 자리다.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
