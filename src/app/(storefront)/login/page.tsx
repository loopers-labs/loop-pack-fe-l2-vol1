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

  // 로그인 상태면 목적지로 보낸다. 로그인 성공 직후의 갱신도 이 경로를 지나
  // nextPath로 이동한다.
  if (session.status === 'signed-in') {
    redirect(nextPath)
  }

  return <LoginForm expired={expired} />
}
