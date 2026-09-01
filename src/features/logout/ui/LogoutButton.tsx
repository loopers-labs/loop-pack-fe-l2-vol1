'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { AuthRepository } from '@/entities/auth/api/AuthRepository'
import { useAuth } from '@/entities/auth/model/AuthProvider'
import { ApiClientError } from '@/shared/api/ApiClientError'

export function LogoutButton() {
  const repository = useMemo(() => new AuthRepository(), [])
  const { clearSession } = useAuth()
  const router = useRouter()
  const logout = useMutation({
    mutationFn: () => repository.logout(),
    onSuccess: () => {
      clearSession()
      router.replace('/')
      router.refresh()
    },
  })

  const errorMessage =
    logout.error instanceof ApiClientError
      ? logout.error.message
      : logout.error === null
        ? null
        : '로그아웃 중 오류가 발생했습니다. 다시 시도해 주세요.'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => {
          logout.mutate()
        }}
        className="min-h-11 rounded px-3 py-2 text-sm font-semibold text-(--color-text) hover:bg-(--color-surface-muted) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {logout.isPending ? '로그아웃 중…' : '로그아웃'}
      </button>
      {errorMessage === null ? null : (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
