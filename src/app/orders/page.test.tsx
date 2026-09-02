import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderListPage } from '@/_pages/orders'
import { getCurrentUser } from '@/entities/session/server'
import Page from './page'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/entities/session/server', () => ({
  getCurrentUser: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedRedirect = vi.mocked(redirect)
const redirectSignal = new Error('NEXT_REDIRECT')

describe('/orders route boundary', () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset()
    mockedRedirect.mockReset()
    mockedRedirect.mockImplementation(() => {
      throw redirectSignal
    })
  })

  it('세션 사용자가 없으면 내부 복귀 경로를 인코딩해 로그인으로 보낸다', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    await expect(Page()).rejects.toBe(redirectSignal)

    expect(mockedGetCurrentUser).toHaveBeenCalledOnce()
    expect(mockedRedirect).toHaveBeenCalledExactlyOnceWith(
      '/login?returnTo=%2Forders',
    )
  })

  it('유효한 세션 사용자가 있으면 주문 내역 화면을 렌더링한다', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 'u1',
      name: '루퍼스',
      email: 'looper1@loopers.dev',
    })

    const element = await Page()

    expect(element.type).toBe(OrderListPage)
    expect(mockedGetCurrentUser).toHaveBeenCalledOnce()
    expect(mockedRedirect).not.toHaveBeenCalled()
  })

  it('query userId가 있어도 세션 사용자가 없으면 권한으로 사용하지 않는다', async () => {
    mockedGetCurrentUser.mockResolvedValue(null)

    await expect(
      Reflect.apply(Page, undefined, [
        { searchParams: Promise.resolve({ userId: 'u1' }) },
      ]),
    ).rejects.toBe(redirectSignal)

    expect(mockedGetCurrentUser).toHaveBeenCalledOnce()
    expect(mockedRedirect).toHaveBeenCalledExactlyOnceWith(
      '/login?returnTo=%2Forders',
    )
  })
})
