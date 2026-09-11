import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckoutPage } from '@/_pages/checkout/ui/CheckoutPage'
import { requireSession } from '@/entities/session/server'

vi.mock('@/entities/session/server', () => ({
  requireSession: vi.fn(),
}))

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('주문서 경로를 세션 가드에 전달한다', async () => {
    await CheckoutPage()

    expect(requireSession).toHaveBeenCalledWith('/checkout')
  })
})
