'use client'

import { useEffect, useRef } from 'react'

import { analyticsEvents, type LoginEventSource } from '@/analytics/events'
import { LoginForm } from '@/features/login/ui/LoginForm'

type LoginViewProps = {
  readonly nextPath: string
  readonly expired: boolean
}

export function LoginView({ nextPath, expired }: LoginViewProps) {
  const from: LoginEventSource = expired
    ? 'expired'
    : nextPath === '/'
      ? 'header'
      : 'protected'
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    analyticsEvents.loginStart({ from })
  }, [from])

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="text-3xl font-extrabold text-(--color-ink)">로그인</h1>
      <p className="mt-3 text-sm leading-6 text-(--color-muted)">
        주문과 주문 내역을 이용하려면 로그인해 주세요.
      </p>
      {expired ? (
        <p
          role="status"
          className="mt-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm break-keep text-amber-900"
        >
          세션이 만료되었습니다. 다시 로그인하면 원래 화면으로 돌아갑니다.
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} from={from} />
    </main>
  )
}
