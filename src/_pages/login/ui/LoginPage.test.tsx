import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/_pages/login/ui/LoginPage'
import { renderWithProviders } from '@/shared/test/render-with-providers'

vi.mock('@/analytics/logger', () => ({
  track: vi.fn(),
}))

const renderLoginPage = async (searchParams: Record<string, string | string[] | undefined>) => {
  const page = await LoginPage({ searchParams: Promise.resolve(searchParams) })
  return renderWithProviders(page)
}

describe('LoginPage', () => {
  it('세션 만료로 들어오면 로그인 폼 위에 다시 로그인하라는 안내를 표시한다', async () => {
    await renderLoginPage({ returnUrl: '/cart', reason: 'session_expired' })

    expect(screen.getByRole('status')).toHaveTextContent(
      '세션이 만료되었습니다. 다시 로그인해 주세요.',
    )
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('지원하지 않는 사유는 안내로 표시하지 않는다', async () => {
    await renderLoginPage({ returnUrl: '/cart', reason: 'unknown' })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })
})
