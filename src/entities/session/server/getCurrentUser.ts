import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '../config'
import type { AuthUser } from '../model/types'
import { readSessionToken } from './session'

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value)
}
