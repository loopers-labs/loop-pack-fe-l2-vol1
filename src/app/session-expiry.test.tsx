import { describe, expect, it, vi } from 'vitest'
import { MutationObserver } from '@tanstack/react-query'
import { createBrowserQueryClient } from './providers'
import { login } from '@/_pages/login/api/login'
import { fetchJson } from '@/shared/api/http'
import {
  authFailures,
  testAccount,
  testPassword,
} from '@/test/msw/authHandlers'
import { server } from '@/test/msw/server'

// 상대 URL로 실제 fetch를 태우므로 document base URL이 있는 jsdom 환경에서 실행한다.
describe('세션 만료 경계', () => {
  it('조회 요청의 401만 세션 만료 콜백으로 올린다', async () => {
    const onSessionExpired = vi.fn()
    const queryClient = createBrowserQueryClient(onSessionExpired)

    await expect(
      queryClient.fetchQuery({
        queryKey: ['expired-session'],
        queryFn: () => fetchJson('/api/orders'),
        retry: false,
      }),
    ).rejects.toMatchObject({ status: 401 })

    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('로그인 mutation의 401은 세션 만료 콜백으로 올리지 않는다', async () => {
    const onSessionExpired = vi.fn()
    const queryClient = createBrowserQueryClient(onSessionExpired)
    server.use(authFailures.loginRejected('비밀번호를 다시 확인하세요'))
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (credentials: { email: string; password: string }) =>
        login(credentials),
    })

    await expect(
      mutation.mutate({ email: testAccount.email, password: testPassword }),
    ).rejects.toMatchObject({ status: 401 })

    expect(onSessionExpired).not.toHaveBeenCalled()
  })
})
