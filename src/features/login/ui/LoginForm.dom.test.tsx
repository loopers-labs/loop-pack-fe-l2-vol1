import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/entities/auth/model/AuthProvider'
import { getQueryClient } from '@/shared/lib/getQueryClient'

import { server } from '../../../../tests/setup/mswServer'
import { LoginForm } from './LoginForm'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function AuthenticatedUser() {
  const { session } = useAuth()
  return session.status === 'authenticated' ? <p>{session.user.name}</p> : null
}

function renderLoginForm() {
  const queryClient = getQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={{ status: 'anonymous' }}>
        <LoginForm nextPath="/orders" from="header" />
        <AuthenticatedUser />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  router.replace.mockReset()
  router.refresh.mockReset()
})

describe('LoginForm', () => {
  it('keeps the user on the form for invalid credentials', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json(
          { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(
      screen.getByRole('textbox', { name: '이메일' }),
      'looper1@loopers.dev',
    )
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toBeVisible()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('updates the auth state and restores the protected path after login', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({
          user: {
            id: 'u1',
            name: '루퍼1',
            email: 'looper1@loopers.dev',
          },
        }),
      ),
    )
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(
      screen.getByRole('textbox', { name: '이메일' }),
      'looper1@loopers.dev',
    )
    await user.type(screen.getByLabelText('비밀번호'), 'looper1234')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('루퍼1')).toBeVisible()
    expect(router.replace).toHaveBeenCalledWith('/orders')
    expect(router.refresh).toHaveBeenCalledOnce()
  })
})
