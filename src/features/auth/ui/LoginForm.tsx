'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react'
import { useRouter } from 'next/navigation'
import {
  resetOrderSubmission,
  resetPrivateOrderQueries,
} from '@/entities/order'
import {
  getLoginFailure,
  getLoginSource,
  identifyUser,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
} from '@/analytics/events'
import { ApiError } from '@/shared/api/apiError'
import { getSafeReturnPath } from '@/shared/lib/getSafeReturnPath'
import { login } from '../api/authClient'

const DEFAULT_ERROR_MESSAGE = '로그인에 실패했습니다.'
const EXPIRED_SESSION_MESSAGE = '세션이 만료되었습니다. 다시 로그인해주세요.'

let activeLoginOperation: AbortController | null = null

function startLoginOperation(): AbortController {
  activeLoginOperation?.abort()

  const controller = new AbortController()
  activeLoginOperation = controller
  return controller
}

function isCurrentLoginOperation(controller: AbortController): boolean {
  return activeLoginOperation === controller && !controller.signal.aborted
}

function finishLoginOperation(controller: AbortController): void {
  if (activeLoginOperation === controller) {
    activeLoginOperation = null
  }
}

interface LoginFormProps {
  returnTo?: string
  reason?: string
}

export function LoginForm({ returnTo, reason }: LoginFormProps): JSX.Element {
  const router = useRouter()
  const queryClient = useQueryClient()
  const safeReturnPath = getSafeReturnPath(returnTo)
  // login_start와 결과 이벤트는 같은 화면 진입의 출처를 공유해야 한다.
  const [from] = useState(() => getLoginSource(safeReturnPath))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const activeRequestRef = useRef<AbortController | null>(null)
  const hasTrackedLoginStart = useRef(false)

  useEffect(
    () => () => {
      const controller = activeRequestRef.current
      controller?.abort()
      if (controller !== null) {
        finishLoginOperation(controller)
      }
      activeRequestRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (hasTrackedLoginStart.current) {
      return
    }

    hasTrackedLoginStart.current = true
    trackLoginStart({ from })
  }, [from])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault()
    if (activeRequestRef.current !== null) {
      return
    }

    const controller = startLoginOperation()
    activeRequestRef.current = controller
    setErrorMessage(null)
    setIsPending(true)

    try {
      const user = await login({ email, password }, controller.signal)
      if (!isCurrentLoginOperation(controller)) {
        return
      }
      trackLoginSuccess({ from })
      identifyUser(user.id)
      resetOrderSubmission()
      await resetPrivateOrderQueries(queryClient)
      if (!isCurrentLoginOperation(controller)) {
        return
      }
      router.replace(safeReturnPath)
      router.refresh()
    } catch (error) {
      if (!isCurrentLoginOperation(controller)) {
        return
      }
      trackLoginFail(getLoginFailure(error))
      setErrorMessage(
        error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE,
      )
    } finally {
      finishLoginOperation(controller)
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
        setIsPending(false)
      }
    }
  }

  return (
    <form
      className="commerce-login-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      {reason === 'expired' && (
        <p className="commerce-login-notice" role="status">
          {EXPIRED_SESSION_MESSAGE}
        </p>
      )}
      {errorMessage !== null && (
        <p className="commerce-inline-error" role="alert">
          {errorMessage}
        </p>
      )}
      <label>
        이메일
        <input
          autoComplete="email"
          disabled={isPending}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        비밀번호
        <input
          autoComplete="current-password"
          disabled={isPending}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <button disabled={isPending} type="submit">
        {isPending ? '로그인 중' : '로그인'}
      </button>
      {isPending && <p role="status">로그인 중</p>}
    </form>
  )
}
