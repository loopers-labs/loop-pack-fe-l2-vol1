import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartPage } from '@/_pages/cart/ui/CartPage'
import { requireSession } from '@/entities/session/server'

vi.mock('@/entities/session/server', () => ({
  requireSession: vi.fn(),
}))

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('장바구니 경로를 세션 가드에 전달한다', async () => {
    await CartPage()

    expect(requireSession).toHaveBeenCalledWith('/cart')
  })
})
