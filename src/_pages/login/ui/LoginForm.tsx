'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { login, type LoginCredentials } from '../api/login'
import {
  identifyUser,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
} from '@/analytics/events'
import { ApiError, errorMessageOf, isTimeout } from '@/shared/api/http'
import { replaceDocument } from '@/shared/lib/documentNavigation'

interface LoginFormProps {
  // 서버 페이지에서 safeNextPath()를 거친 값이다. 검증 책임은 서버 한 곳에 둔다.
  nextPath: string
  // 세션이 끝났거나 로그인 상태를 다시 확인해야 해서 온 경우다. 안내 문구가 다르다.
  expired: boolean
  // 직접 진입, 만료, 보호 경로 중 어느 흐름에서 로그인했는지 집계하는 값이다.
  from: string
}

const FALLBACK_MESSAGE = '로그인하지 못했습니다. 잠시 후 다시 시도해주세요.'

// 로그인은 mutation이라 전역 만료 처리(app/providers.tsx)를 지나가지 않는다.
// 여기서 받는 401은 자격 증명 불일치이므로 인라인으로 표시한다.
const failReasonOf = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'invalid_credentials'
    if (error.status >= 500) return 'server_error'
    return 'bad_request'
  }
  if (isTimeout(error)) return 'timeout'
  return 'network'
}

export default function LoginForm({ nextPath, expired, from }: LoginFormProps) {
  const router = useRouter()
  const started = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true
    trackLoginStart({ from })
  }, [from])

  const { mutate, isPending, error } = useMutation({
    // v5의 mutationFn은 두 번째 인자로 signal이 아닌 context를 준다. 그대로 넘기면
    // 취소 신호 자리에 다른 값이 들어가므로 자격 증명만 전달한다.
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: ({ user }) => {
      // 성공 이벤트부터 사용자 퍼널에 이어지도록 응답의 사용자를 먼저 식별한다.
      // AnalyticsBoundary의 identify는 새로고침·직접 진입 세션을 복원하는 역할로 남는다.
      identifyUser(user.id)
      trackLoginSuccess({ from })
      // 만료로 온 경우에는 서버 페이지가 redirect하지 않는다(무한 반복 방지). 이동을
      // 여기서 한다. 만료 화면에 올 때 이미 문서 이동을 거쳐 메모리 상태를 잃은 뒤라
      // 문서 이동을 한 번 더 해도 추가로 잃는 상태가 없다.
      if (expired) {
        replaceDocument(nextPath)
        return
      }

      // 일반 경로에서는 갱신만 한다. 로그인 화면을 다시 렌더하면 서버가 세션을 읽고
      // nextPath로 redirect한다. 문서를 다시 받지 않으므로 장바구니 같은 메모리 상태가
      // 남는다. 이동과 갱신을 함께 부르면 두 요청이 경쟁한다.
      router.refresh()
    },
    onError: (error) => {
      trackLoginFail({ reason: failReasonOf(error) })
    },
  })

  return (
    <main className="week09-auth">
      <h1>로그인</h1>

      {expired ? (
        <p className="week09-auth-notice" role="status">
          로그인 상태를 다시 확인해야 합니다. 다시 로그인해주세요.
        </p>
      ) : null}

      <form
        className="week09-auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          mutate({ email, password })
        }}
      >
        <label htmlFor="login-email">이메일</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="login-password">비밀번호</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? (
          <p className="week09-auth-error" role="alert">
            {errorMessageOf(error, FALLBACK_MESSAGE)}
          </p>
        ) : null}

        <button type="submit" disabled={isPending}>
          {isPending ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </main>
  )
}
