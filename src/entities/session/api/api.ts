import type { SessionUser } from '@/entities/session/model/session'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

type SessionResponse = {
  user: SessionUser
}

/*
 * 서버 호출자는 cookies()로 읽은 Cookie 헤더를 넘기고, 브라우저는 쿠키를 자동 전송한다.
 * 클라이언트에서도 사용하는 모듈이므로 next/headers를 직접 import하지 않는다.
 * 401은 공개 화면에서 정상적인 미로그인 응답으로 취급해 null을 반환한다.
 */
export const getSession = async (
  cookieHeader?: string,
  signal?: AbortSignal,
): Promise<SessionUser | null> => {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/auth/me`, {
    headers:
      cookieHeader === undefined || cookieHeader === '' ? undefined : { Cookie: cookieHeader },
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    return null
  }

  const data: SessionResponse = await response.json()
  return data.user
}
