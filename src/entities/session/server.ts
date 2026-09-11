import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/api/api'
import type { SessionUser } from '@/entities/session/model/session'
import { LOGIN_REASON, toLoginPath } from '@/shared/lib/to-login-path'

export const requireSession = async (returnPath: string): Promise<SessionUser> => {
  const cookieHeader = (await cookies()).toString()
  const user = await getSession(cookieHeader)

  if (user === null) {
    redirect(toLoginPath(returnPath, { reason: LOGIN_REASON.SESSION_EXPIRED }))
  }

  return user
}
