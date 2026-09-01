'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { type SyntheticEvent, useMemo } from 'react'

import { identify } from '@/analytics/logger'
import { AuthRepository } from '@/entities/auth/api/AuthRepository'
import { useAuth } from '@/entities/auth/model/AuthProvider'
import type { LoginRequest } from '@/entities/auth/model/AuthSchema'
import { ApiClientError } from '@/shared/api/ApiClientError'

type LoginFormProps = {
  readonly nextPath: string
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const repository = useMemo(() => new AuthRepository(), [])
  const { authenticate } = useAuth()
  const router = useRouter()
  const login = useMutation({
    mutationFn: (request: LoginRequest) => repository.login(request),
    onSuccess: ({ user }) => {
      identify(user.id)
      authenticate(user)
      router.replace(nextPath)
      router.refresh()
    },
  })

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')
    if (typeof email !== 'string' || typeof password !== 'string') {
      return
    }
    login.mutate({
      email,
      password,
    })
  }

  const errorMessage =
    login.error instanceof ApiClientError
      ? login.error.message
      : login.error === null
        ? null
        : '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-(--color-ink)"
        >
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={login.isPending}
          className="mt-2 min-h-11 w-full rounded border border-(--color-border) bg-white px-3 py-2 text-(--color-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-(--color-ink)"
        >
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={login.isPending}
          className="mt-2 min-h-11 w-full rounded border border-(--color-border) bg-white px-3 py-2 text-(--color-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
        />
      </div>
      {errorMessage === null ? null : (
        <p role="alert" className="text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={login.isPending}
        className="min-h-11 w-full rounded bg-(--color-ink) px-4 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {login.isPending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}
