import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/entities/session/api/api'
import { requireSession } from '@/entities/session/server'

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ toString: (): string => 'session=expired' })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/entities/session/api/api', () => ({
  getSession: vi.fn(),
}))

describe('requireSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('세션이 없으면 세션 만료 이유를 포함해 로그인으로 보낸다', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    await requireSession('/cart')

    expect(redirect).toHaveBeenCalledWith('/login?returnUrl=%2Fcart&reason=session_expired')
  })

  it('유효한 세션이면 리다이렉트하지 않는다', async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: 'test-user',
      name: '테스트 사용자',
      email: 'test@example.com',
    })

    await requireSession('/cart')

    expect(redirect).not.toHaveBeenCalled()
  })
})
