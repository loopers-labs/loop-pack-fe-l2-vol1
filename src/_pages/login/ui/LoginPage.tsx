import type { JSX } from 'react'
import { LoginForm } from '@/features/auth'

interface LoginPageProps {
  returnTo?: string
  reason?: string
}

export function LoginPage({ returnTo, reason }: LoginPageProps): JSX.Element {
  return (
    <main className="week05-page commerce-login-page">
      <section className="commerce-login-panel" aria-labelledby="login-heading">
        <h1 id="login-heading">로그인</h1>
        <p>계속하려면 로그인해주세요.</p>
        <LoginForm returnTo={returnTo} reason={reason} />
      </section>
    </main>
  )
}
