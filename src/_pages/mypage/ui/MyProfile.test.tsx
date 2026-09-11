import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/shared/config/routes'
import { requireSession } from '@/entities/session/server'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { MyProfile } from '@/_pages/mypage/ui/MyProfile'

vi.mock('@/entities/session/server', () => ({
  requireSession: vi.fn(),
}))

describe('MyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSession).mockResolvedValue({
      id: 'test-user',
      name: '테스트 사용자',
      email: 'test@example.com',
    })
  })

  it('마이페이지 경로를 세션 가드에 전달한다', async () => {
    renderWithProviders(await MyProfile())

    expect(requireSession).toHaveBeenCalledWith(ROUTES.MYPAGE)
    expect(screen.getByText('테스트 사용자')).toBeInTheDocument()
  })
})
