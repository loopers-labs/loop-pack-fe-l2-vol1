import { ApiError } from '@/shared/api/http'
import { LOGIN_PATH, NEXT_PARAM, safeNextPath } from './loginRedirect'

// /api/auth/me는 "로그인 안 함"과 "세션 만료"를 같은 401로 돌려준다. 서버가 구분해 주지
// 않으므로 클라이언트가 기준을 정한다. 기준은 누가 그 401을 받았는가다.
//
// - 조회(query)의 401 = 만료. 로그인된 상태를 전제로 보낸 요청이 거절된 것이다.
// - 로그인 요청의 401 = 자격 증명 불일치. 로그인 이전이라 만료가 아니고, 폼이 인라인으로 받는다.
//
// 이 구분은 배치로 강제한다. 만료 감지는 QueryCache에만 붙어 있어(app/providers.tsx)
// mutation인 로그인 요청은 이 판정을 지나가지 않는다.

export const EXPIRY_REASON_PARAM = 'reason'
export const EXPIRED_REASON = 'expired'

export const isSessionExpiredError = (error: unknown) =>
  error instanceof ApiError && error.status === 401

// 만료로 로그인 화면에 보낼 때 쓰는 주소다. 이유를 함께 실어야 화면이 안내를 띄울 수 있다.
export const expiredLoginPathFor = (nextPath?: string | null): string => {
  const params = new URLSearchParams({ [EXPIRY_REASON_PARAM]: EXPIRED_REASON })
  const safe = safeNextPath(nextPath)
  if (safe !== '/') params.set(NEXT_PARAM, safe)

  return `${LOGIN_PATH}?${params.toString()}`
}
