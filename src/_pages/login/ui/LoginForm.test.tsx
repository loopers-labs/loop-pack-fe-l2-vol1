import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'
import {
  authFailures,
  testAccount,
  testPassword,
} from '@/test/msw/authHandlers'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { resetRouterMock, router } from '@/test/nextRouterMock'
import { replaceDocument } from '@/shared/lib/documentNavigation'
import { identifyUser, trackLoginSuccess } from '@/analytics/events'

vi.mock('next/navigation', () => import('@/test/nextRouterMock'))
vi.mock('@/shared/lib/documentNavigation', () => ({
  replaceDocument: vi.fn(),
}))
vi.mock('@/analytics/events', () => ({
  identifyUser: vi.fn(),
  trackLoginStart: vi.fn(),
  trackLoginSuccess: vi.fn(),
  trackLoginFail: vi.fn(),
}))

const fillAndSubmit = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('이메일'), testAccount.email)
  await user.type(screen.getByLabelText('비밀번호'), testPassword)
  await user.click(screen.getByRole('button', { name: '로그인' }))
}

describe('LoginForm', () => {
  beforeEach(() => {
    resetRouterMock()
    vi.mocked(replaceDocument).mockReset()
    vi.mocked(identifyUser).mockReset()
    vi.mocked(trackLoginSuccess).mockReset()
  })

  it('서버가 준 로그인 실패 메시지를 alert로 보여주고 이동하지 않는다', async () => {
    const serverMessage = '테스트가 정한 자격 증명 오류'
    server.use(authFailures.loginRejected(serverMessage))
    renderWithProviders(
      <LoginForm nextPath="/orders" expired={false} from="/orders" />,
    )

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(serverMessage)
    expect(router.refresh).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(replaceDocument).not.toHaveBeenCalled()
  })

  it('일반 로그인 성공은 서버 재렌더만 요청해 메모리 상태를 보존한다', async () => {
    renderWithProviders(
      <LoginForm nextPath="/orders" expired={false} from="/orders" />,
    )

    await fillAndSubmit()

    expect(identifyUser).toHaveBeenCalledWith(testAccount.id)
    expect(trackLoginSuccess).toHaveBeenCalledWith({ from: '/orders' })
    expect(vi.mocked(identifyUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(trackLoginSuccess).mock.invocationCallOrder[0],
    )
    expect(router.refresh).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
    expect(replaceDocument).not.toHaveBeenCalled()
  })

  it('만료 후 재로그인은 검증된 원래 경로로 문서 이동한다', async () => {
    renderWithProviders(<LoginForm nextPath="/orders" expired from="expired" />)

    await fillAndSubmit()

    expect(replaceDocument).toHaveBeenCalledOnce()
    expect(replaceDocument).toHaveBeenCalledWith('/orders')
    expect(router.refresh).not.toHaveBeenCalled()
  })
})
