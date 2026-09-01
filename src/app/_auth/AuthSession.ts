import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'

import { readSessionToken } from '@/app/api/_data/auth'
import { SCENARIO_COOKIE, SESSION_COOKIE } from '@/app/api/_data/auth-cookies'
import type { AuthSession } from '@/entities/auth/model/AuthSession'

type AuthSessionInput = {
  readonly token: string | undefined
  readonly scenario: string | undefined
}

export function resolveAuthSession(
  { token, scenario }: AuthSessionInput,
  nowMs = Date.now(),
): AuthSession {
  if (token === undefined) {
    return { status: 'anonymous' }
  }
  if (scenario === 'expired') {
    return { status: 'expired' }
  }

  const user = readSessionToken(token, nowMs)
  return user === null
    ? { status: 'expired' }
    : { status: 'authenticated', user }
}

async function readAuthSession(): Promise<AuthSession> {
  const cookieStore = await cookies()
  return resolveAuthSession({
    token: cookieStore.get(SESSION_COOKIE)?.value,
    scenario: cookieStore.get(SCENARIO_COOKIE)?.value,
  })
}

export const getAuthSession = cache(readAuthSession)
