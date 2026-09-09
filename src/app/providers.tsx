'use client'

import '@/analytics/client'

import {
  QueryClientProvider,
  QueryErrorResetBoundary,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { AuthProvider, useAuth } from '@/entities/auth/model/AuthProvider'
import { AuthRedirect } from '@/entities/auth/model/AuthRedirect'
import type { AuthSession } from '@/entities/auth/model/AuthSession'
import { getQueryClient } from '@/shared/lib/getQueryClient'

type ProvidersProps = {
  readonly initialSession: AuthSession
  readonly children: ReactNode
}

type AuthExpiryChannel = {
  readonly notify: () => void
  readonly subscribe: (handler: () => void) => () => void
}

function createAuthExpiryChannel(): AuthExpiryChannel {
  let currentHandler: () => void = () => undefined

  return {
    notify: () => {
      currentHandler()
    },
    subscribe: (handler) => {
      currentHandler = handler
      return () => {
        if (currentHandler === handler) {
          currentHandler = () => undefined
        }
      }
    },
  }
}

function AuthExpiryBridge({
  channel,
}: {
  readonly channel: AuthExpiryChannel
}) {
  const { expireSession } = useAuth()
  const router = useRouter()
  const handleSessionExpired = useCallback(() => {
    expireSession()
    const currentPath = `${window.location.pathname}${window.location.search}`
    router.replace(`${AuthRedirect.toLoginPath(currentPath)}&reason=expired`)
  }, [expireSession, router])

  useEffect(
    () => channel.subscribe(handleSessionExpired),
    [channel, handleSessionExpired],
  )

  return null
}

export function Providers({ initialSession, children }: ProvidersProps) {
  const [expiryChannel] = useState(createAuthExpiryChannel)
  const [queryClient] = useState(() =>
    getQueryClient({
      onSessionExpired: () => {
        expiryChannel.notify()
      },
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={initialSession}>
        <AuthExpiryBridge channel={expiryChannel} />
        <QueryErrorResetBoundary>
          <NuqsAdapter>{children}</NuqsAdapter>
        </QueryErrorResetBoundary>
      </AuthProvider>
    </QueryClientProvider>
  )
}
