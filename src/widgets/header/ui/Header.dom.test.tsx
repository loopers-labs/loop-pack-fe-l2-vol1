import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Providers } from '@/app/providers'

import { Header } from './Header'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

describe('Header initial auth state', () => {
  it('renders the authenticated user and protected navigation immediately', () => {
    render(
      <Providers
        initialSession={{
          status: 'authenticated',
          user: {
            id: 'u1',
            name: '루퍼1',
            email: 'looper1@loopers.dev',
          },
        }}
      >
        <Header />
      </Providers>,
    )

    expect(screen.getByText('루퍼1')).toBeVisible()
    expect(screen.getByRole('link', { name: '주문서' })).toHaveAttribute(
      'href',
      '/checkout',
    )
    expect(screen.getByRole('link', { name: '주문 내역' })).toHaveAttribute(
      'href',
      '/orders',
    )
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeVisible()
    expect(
      screen.queryByRole('link', { name: '로그인' }),
    ).not.toBeInTheDocument()
  })

  it('renders a login link for an anonymous session', () => {
    render(
      <Providers initialSession={{ status: 'anonymous' }}>
        <Header />
      </Providers>,
    )

    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(
      screen.queryByRole('button', { name: '로그아웃' }),
    ).not.toBeInTheDocument()
  })
})
