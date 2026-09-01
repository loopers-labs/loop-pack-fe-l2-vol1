import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { readSessionToken } from '@/app/api/_data/auth'
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/app/api/_data/auth-cookies'
import {
  expiredLoginPathFor,
  EXPIRED_REASON,
} from '@/entities/session/model/sessionExpiry'
import { loginPathFor } from '@/entities/session/model/loginRedirect'
import type { SessionUser } from '@/entities/session/model/session'

// 서버가 세션을 읽는 유일한 자리다. 초기 HTML 에 로그인 상태를 담는 값이 여기서 나온다.
//
// 자기 API(`/api/auth/me`)를 부르지 않는다. mock 백엔드가 요청마다 500ms 를 쉬므로,
// 모든 페이지의 서버 렌더가 그만큼 늦어진다. 같은 프로세스 안에서 쿠키를 직접 읽으면
// 왕복이 없다. 대신 검증 규칙은 API 와 같은 함수(readSessionToken)를 쓴다.
//
// 이 파일이 app 레이어에 있는 이유도 그것이다. mock 백엔드는 app 레이어라
// 아래 레이어(entities, widgets)가 참조하면 역방향 의존이 된다. 세션을 읽는 일은
// app 이 하고, 아래로는 값만 내려보낸다.

// "로그인 안 함"과 "세션이 끝남"을 갈라 둔다. 사용자에게 할 말이 다르기 때문이다.
// 전자는 로그인하라는 말이고, 후자는 다시 로그인하라는 말이다.
export type ServerSession =
  | { status: 'signed-in'; user: SessionUser }
  | { status: 'signed-out' }
  | { status: 'expired' }

export const readServerSession = async (): Promise<ServerSession> => {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (token === undefined || token === '') return { status: 'signed-out' }

  // 시나리오 노브를 서버 렌더도 함께 본다. API 만 만료로 굴고 서버 렌더는 로그인
  // 상태를 그리면, 헤더에는 이름이 남은 채로 목록만 401 이 되는 화면이 나온다.
  if (store.get(SCENARIO_COOKIE)?.value === EXPIRED_REASON) {
    return { status: 'expired' }
  }

  const user = readSessionToken(token)
  return user === null ? { status: 'expired' } : { status: 'signed-in', user }
}

export const sessionUserOf = (session: ServerSession): SessionUser | null =>
  session.status === 'signed-in' ? session.user : null

/**
 * 보호 경로가 세션을 실제로 판정하는 자리다. proxy 는 쿠키의 존재만 보므로,
 * 위조하거나 만료된 값은 여기서 걸린다.
 *
 * 돌아올 경로를 인자로 받는 이유는 서버 컴포넌트가 자기 pathname 을 모르기 때문이다.
 * proxy 가 헤더로 실어 보내는 방법도 있지만, 그러면 경로가 요청 헤더를 타고 흐르는
 * 숨은 입력이 된다. 자기 경로를 아는 것은 그 페이지 자신이므로 직접 적는다.
 */
export const requireSessionUser = async (
  nextPath: string,
): Promise<SessionUser> => {
  const session = await readServerSession()
  if (session.status === 'signed-in') return session.user

  redirect(
    session.status === 'expired'
      ? expiredLoginPathFor(nextPath)
      : loginPathFor(nextPath),
  )
}
