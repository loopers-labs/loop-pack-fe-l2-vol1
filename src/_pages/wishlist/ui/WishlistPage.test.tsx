import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WishlistPage } from '@/_pages/wishlist/ui/WishlistPage'
import { requireSession } from '@/entities/session/server'

vi.mock('@/entities/session/server', () => ({
  requireSession: vi.fn(),
}))

const searchParams = Promise.resolve({ entryPoint: 'header_wishlist' })

describe('WishlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('유입 위치를 보존한 경로를 세션 가드에 전달한다', async () => {
    await WishlistPage({ searchParams })

    expect(requireSession).toHaveBeenCalledWith('/wishlist?entryPoint=header_wishlist')
  })
})
