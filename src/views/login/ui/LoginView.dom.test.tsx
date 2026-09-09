import '@/analytics/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { registerProviders } from '@/analytics/logger'
import { AuthProvider } from '@/entities/auth/model/AuthProvider'

import { server } from '../../../../tests/setup/mswServer'
import { LoginView } from './LoginView'

type CapturedCall =
  | {
      readonly type: 'track'
      readonly event: string
      readonly properties: Record<string, unknown>
    }
  | { readonly type: 'identify'; readonly userId: string }
  | { readonly type: 'reset' }

const calls: Array<CapturedCall> = []

registerProviders([
  {
    name: 'capture',
    initialize() {},
    track: (event, properties) => {
      calls.push({ type: 'track', event, properties })
    },
    identify: (userId) => {
      calls.push({ type: 'identify', userId })
    },
    reset: () => {
      calls.push({ type: 'reset' })
    },
  },
])

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

const tracked = (event: string) =>
  calls.filter(
    (call): call is Extract<CapturedCall, { type: 'track' }> =>
      call.type === 'track' && call.event === event,
  )

function renderLogin(nextPath: string, expired: boolean) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider initialSession={{ status: 'anonymous' }}>
        <LoginView nextPath={nextPath} expired={expired} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  calls.length = 0
  router.replace.mockReset()
  router.refresh.mockReset()
})

describe('LoginView instrumentation', () => {
  it('emits login_start once with the protected source', () => {
    const view = renderLogin('/orders', false)

    expect(tracked('login_start')).toHaveLength(1)
    expect(tracked('login_start')[0].properties.from).toBe('protected')

    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider initialSession={{ status: 'anonymous' }}>
          <LoginView nextPath="/orders" expired={false} />
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(tracked('login_start')).toHaveLength(1)
  })

  it('emits login_start with the expired source', () => {
    renderLogin('/orders', true)

    expect(tracked('login_start')[0].properties.from).toBe('expired')
  })

  it('emits login_start with the header source for a plain login', () => {
    renderLogin('/', false)

    expect(tracked('login_start')[0].properties.from).toBe('header')
  })

  it('identifies before login_success after a valid login', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({
          user: { id: 'u1', name: '루퍼1', email: 'looper1@loopers.dev' },
        }),
      ),
    )
    const user = userEvent.setup()
    renderLogin('/orders', false)

    await user.type(
      screen.getByRole('textbox', { name: '이메일' }),
      'looper1@loopers.dev',
    )
    await user.type(screen.getByLabelText('비밀번호'), 'looper1234')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(tracked('login_success')).toHaveLength(1)
    })
    const identifyIndex = calls.findIndex(
      (call) => call.type === 'identify' && call.userId === 'u1',
    )
    const successIndex = calls.findIndex(
      (call) => call.type === 'track' && call.event === 'login_success',
    )
    expect(identifyIndex).toBeGreaterThanOrEqual(0)
    expect(identifyIndex).toBeLessThan(successIndex)
    expect(tracked('login_success')[0].properties.from).toBe('protected')
  })

  it.each([
    [401, 'invalid_credentials'],
    [400, 'invalid_request'],
    [500, 'server_error'],
  ] as const)(
    'emits login_fail with reason %s for status %i',
    async (status, reason) => {
      server.use(
        http.post('http://localhost:3000/api/auth/login', () =>
          HttpResponse.json({ message: '실패' }, { status }),
        ),
      )
      const user = userEvent.setup()
      renderLogin('/orders', false)

      await user.type(
        screen.getByRole('textbox', { name: '이메일' }),
        'looper1@loopers.dev',
      )
      await user.type(screen.getByLabelText('비밀번호'), 'wrong')
      await user.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(tracked('login_fail')).toHaveLength(1)
      })
      expect(tracked('login_fail')[0].properties.reason).toBe(reason)
      expect(tracked('login_success')).toHaveLength(0)
      expect(calls.filter((call) => call.type === 'identify')).toHaveLength(0)
    },
  )

  it('emits login_fail with network_error for a transport failure', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.error(),
      ),
    )
    const user = userEvent.setup()
    renderLogin('/orders', false)

    await user.type(
      screen.getByRole('textbox', { name: '이메일' }),
      'looper1@loopers.dev',
    )
    await user.type(screen.getByLabelText('비밀번호'), 'looper1234')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(tracked('login_fail')).toHaveLength(1)
    })
    expect(tracked('login_fail')[0].properties.reason).toBe('network_error')
  })
})

describe('AuthProvider identity lifecycle', () => {
  it('identifies the initial authenticated user before page events', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider
          initialSession={{
            status: 'authenticated',
            user: { id: 'u3', name: '루퍼3', email: 'looper3@loopers.dev' },
          }}
        >
          <p>ready</p>
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(calls[0]).toEqual({ type: 'identify', userId: 'u3' })
  })
})
