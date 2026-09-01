import { PROTECTED_ROUTES } from '@/shared/config/routes';
import type { LoginEntryPoint } from '@/shared/lib/analytics/events';

/**
 * 로그인 화면에 오게 된 경로를 시드 로그의 `from` 값으로 옮긴다.
 *
 * 시드 로그는 `from: "cart"` 처럼 어느 화면에서 로그인하러 왔는지를 담는다. 우리는 그 정보를
 * proxy 가 붙인 returnTo 로 갖고 있으므로 첫 구간을 값으로 쓴다.
 *
 * returnTo 가 없으면 사용자가 직접 /login 으로 온 것이고, 보호 목록에 없는 경로가 담겨 있으면
 * 우리가 만든 값이 아니다. 둘 다 direct 로 본다 — 임의의 경로를 그대로 실으면 집계할 때
 * 값의 가짓수가 열려 있어 셀 수 없다.
 */
export function toLoginEntryPoint(returnTo: string | undefined): LoginEntryPoint {
  if (returnTo === undefined) {
    return 'direct';
  }

  // proxy 는 원래 쿼리까지 returnTo 에 담는다(/mypage?tab=profile). 경로만 떼어 비교한다.
  const pathname = returnTo.split(/[?#]/)[0];

  const matched = PROTECTED_ROUTES.find((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (matched === undefined) {
    return 'direct';
  }

  return matched.slice(1) as LoginEntryPoint;
}
