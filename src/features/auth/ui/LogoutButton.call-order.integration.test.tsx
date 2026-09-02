import '@/test/setup/msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { LogoutButton } from './LogoutButton'

const LOGOUT_ENDPOINT = 'http://localhost:3000/api/auth/logout'

const dependencies = vi.hoisted(() => ({
  clearWishlist: vi.fn(),
  router: { refresh: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => dependencies.router,
}))

vi.mock('@/entities/wishlist', () => ({
  useClearWishlist: () => dependencies.clearWishlist,
}))

describe('LogoutButton side-effect order', () => {
  beforeEach(() => {
    dependencies.clearWishlist.mockReset()
    dependencies.router.refresh.mockReset()
  })

  it('clears wishlist state before refreshing after a 204 logout response', async () => {
    server.use(
      http.post(LOGOUT_ENDPOINT, () => new HttpResponse(null, { status: 204 })),
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={queryClient}>
        <LogoutButton />
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: '로그아웃' }))

    await vi.waitFor(() => {
      expect(dependencies.clearWishlist).toHaveBeenCalledOnce()
      expect(dependencies.router.refresh).toHaveBeenCalledOnce()
    })
    const clearOrder = dependencies.clearWishlist.mock.invocationCallOrder[0]
    const refreshOrder = dependencies.router.refresh.mock.invocationCallOrder[0]

    if (clearOrder === undefined || refreshOrder === undefined) {
      throw new Error('Logout side effects were not recorded.')
    }
    expect(clearOrder).toBeLessThan(refreshOrder)
  })
})
