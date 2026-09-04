import type { SessionUser } from '@/entities/session/model/session'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

type SessionResponse = {
  user: SessionUser
}

// 서버와 클라이언트 양쪽에서 부른다. 브라우저는 쿠키를 알아서 붙이지만 서버 fetch는 그러지
// 않으므로, 서버 호출자가 cookies()로 읽은 값을 넘긴다.
//
// next/headers를 여기서 부르지 않는 것은 이 모듈이 클라이언트 번들에도 들어가기 때문이다.
// 서버 전용 API를 import하면 클라이언트가 이 슬라이스를 쓰는 순간 빌드가 막힌다.
//
// 쿠키를 해석하지 않고 전달만 한다. readSessionToken을 직접 부르면 지연 없이 끝나지만
// 그 함수는 mock 서버의 내부 모듈이라 실제 백엔드가 분리되면 쓸 수 없다.
//
// 401(미로그인·만료)은 예외가 아니라 정상적인 답이라 null로 돌려준다.
// 던지지 않는 것이 중요하다 — 던지면 공개 화면을 보는 미로그인 방문자의 401이
// 전역 만료 처리로 새어 들어가 처음 온 사람에게 세션 만료 화면이 뜬다.
export const getSession = async (cookieHeader?: string): Promise<SessionUser | null> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    headers:
      cookieHeader === undefined || cookieHeader === '' ? undefined : { Cookie: cookieHeader },
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const data: SessionResponse = await response.json()
  return data.user
}
