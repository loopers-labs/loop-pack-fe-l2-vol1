import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { readServerSession } from '@/app/_session/currentUser'
import LoginForm from '@/_pages/login/ui/LoginForm'
import {
  NEXT_PARAM,
  safeNextPath,
} from '@/entities/session/model/loginRedirect'
import {
  EXPIRED_REASON,
  EXPIRY_REASON_PARAM,
} from '@/entities/session/model/sessionExpiry'

export const metadata: Metadata = {
  title: '로그인',
}

type SearchParams = Record<string, string | string[] | undefined>

const single = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : null

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  // 밖에서 들어온 값은 화면에 닿기 전에 여기서 한 번 거른다.
  const nextPath = safeNextPath(single(params[NEXT_PARAM]))
  const expired = single(params[EXPIRY_REASON_PARAM]) === EXPIRED_REASON

  const session = await readServerSession()

  // 로그인 상태면 목적지로 보낸다. 로그인 성공 직후의 갱신도 이 경로로 이동한다.
  //
  // 만료로 온 경우(reason=expired)는 예외다. 서버는 세션을 유효하다고 보는데 조회는
  // 401을 받는 상태가 있고, 그때 여기서 되돌려 보내면 401과 이동이 무한히 반복된다.
  // 이 경우에는 재인증 화면을 보여준다.
  if (session.status === 'signed-in' && !expired) {
    redirect(nextPath)
  }

  let from = nextPath === '/' ? 'direct' : nextPath
  if (expired) from = 'expired'

  return <LoginForm nextPath={nextPath} expired={expired} from={from} />
}
