import { redirect } from 'next/navigation'

import { getAuthSession } from '@/app/_auth/AuthSession'
import { AuthRedirect } from '@/entities/auth/model/AuthRedirect'
import { LoginView } from '@/views/login/ui/LoginView'

type LoginPageProps = {
  readonly searchParams: Promise<{
    readonly next?: string | ReadonlyArray<string>
    readonly reason?: string | ReadonlyArray<string>
  }>
}

function firstValue(value: string | ReadonlyArray<string> | undefined) {
  return typeof value === 'string' ? value : value?.[0]
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const nextPath = AuthRedirect.resolveNext(params.next)
  const session = await getAuthSession()

  if (session.status === 'authenticated') {
    redirect(nextPath)
  }

  return (
    <LoginView
      nextPath={nextPath}
      expired={firstValue(params.reason) === 'expired'}
    />
  )
}
