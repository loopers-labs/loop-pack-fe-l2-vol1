'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState, type JSX } from 'react'
import { useRouter } from 'next/navigation'
import {
  resetOrderSubmission,
  resetPrivateOrderQueries,
} from '@/entities/order'
import { useClearWishlist } from '@/entities/wishlist'
import { ApiError } from '@/shared/api/apiError'
import { logout } from '../api/authClient'

const DEFAULT_ERROR_MESSAGE = '로그아웃에 실패했습니다.'

export function LogoutButton(): JSX.Element {
  const router = useRouter()
  const queryClient = useQueryClient()
  const clearWishlist = useClearWishlist()
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogout = async (): Promise<void> => {
    setErrorMessage(null)
    setIsPending(true)

    try {
      await logout()
      resetOrderSubmission()
      await resetPrivateOrderQueries(queryClient)
      clearWishlist()
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE,
      )
      setIsPending(false)
    }
  }

  return (
    <>
      {errorMessage !== null && (
        <p className="commerce-inline-error" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        disabled={isPending}
        onClick={() => void handleLogout()}
        type="button"
      >
        {isPending ? '로그아웃 중' : '로그아웃'}
      </button>
    </>
  )
}
