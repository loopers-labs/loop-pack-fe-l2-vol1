'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { reset } from '@/analytics/logger'
import type { AuthUser } from '@/entities/auth/model/AuthSchema'
import type { AuthSession } from '@/entities/auth/model/AuthSession'

type AuthContextValue = {
  readonly session: AuthSession
  readonly authenticate: (user: AuthUser) => void
  readonly clearSession: () => void
  readonly expireSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  readonly initialSession: AuthSession
  readonly children: ReactNode
}

export function AuthProvider({ initialSession, children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(initialSession)
  const expiringRef = useRef(false)

  const removeProtectedState = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => query.meta?.requiresAuth === true,
    })
    const mutationCache = queryClient.getMutationCache()
    for (const mutation of mutationCache.findAll({
      predicate: (candidate) => candidate.meta?.requiresAuth === true,
    })) {
      mutationCache.remove(mutation)
    }
  }, [queryClient])

  const authenticate = useCallback((user: AuthUser) => {
    expiringRef.current = false
    setSession({ status: 'authenticated', user })
  }, [])

  const clearSession = useCallback(() => {
    expiringRef.current = false
    removeProtectedState()
    reset()
    setSession({ status: 'anonymous' })
  }, [removeProtectedState])

  const expireSession = useCallback(() => {
    if (expiringRef.current) {
      return
    }

    expiringRef.current = true
    removeProtectedState()
    reset()
    setSession({ status: 'expired' })
  }, [removeProtectedState])

  const value = useMemo<AuthContextValue>(
    () => ({ session, authenticate, clearSession, expireSession }),
    [authenticate, clearSession, expireSession, session],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
