import '@/test/setup/msw'
import { HttpResponse, delay, http } from 'msw'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { LoginForm } from './LoginForm'

const LOGIN_ENDPOINT = 'http://localhost:3000/api/auth/login'
const EMAIL = 'member@loopers.dev'
const PASSWORD = 'password1234'

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

function renderLoginForm(props: { returnTo?: string; reason?: string } = {}) {
  return {
    user: userEvent.setup(),
    ...render(<LoginForm {...props} />),
  }
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByLabelText('이메일'), EMAIL)
  await user.type(screen.getByLabelText('비밀번호'), PASSWORD)
  await user.click(screen.getByRole('button', { name: '로그인' }))
}

describe('로그인 폼', () => {
  beforeEach(() => {
    router.replace.mockReset()
    router.refresh.mockReset()
  })

  it('이메일과 비밀번호 입력 및 제출 버튼을 접근 가능하게 제공한다', () => {
    renderLoginForm()

    expect(screen.getByLabelText('이메일')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute(
      'type',
      'password',
    )
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled()
  })

  it('정확한 자격 증명을 전송하고 안전한 복귀 경로로 대체 이동한다', async () => {
    let requestBody: unknown
    server.use(
      http.post(LOGIN_ENDPOINT, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          user: { id: 'u1', name: '루퍼스', email: EMAIL },
        })
      }),
    )
    const { user } = renderLoginForm({ returnTo: '/checkout' })

    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/checkout')
    })
    expect(requestBody).toEqual({ email: EMAIL, password: PASSWORD })
    expect(localStorage).toHaveLength(0)
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('외부 복귀 경로는 홈으로 대체 이동한다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json({
          user: { id: 'u1', name: '루퍼스', email: EMAIL },
        }),
      ),
    )
    const { user } = renderLoginForm({ returnTo: 'https://evil.example' })

    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/')
    })
  })

  it('401이면 자격 증명 오류를 표시하고 폼에 머문다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json(
          { message: '이메일 또는 비밀번호를 확인해주세요.' },
          { status: 401 },
        ),
      ),
    )
    const { user } = renderLoginForm()

    await fillAndSubmit(user)

    expect(
      await screen.findByText('이메일 또는 비밀번호를 확인해주세요.'),
    ).toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled()
  })

  it('500이면 서버 메시지를 표시하고 폼에 머문다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json(
          { message: '인증 서버를 사용할 수 없습니다.' },
          { status: 500 },
        ),
      ),
    )
    const { user } = renderLoginForm()

    await fillAndSubmit(user)

    expect(
      await screen.findByText('인증 서버를 사용할 수 없습니다.'),
    ).toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled()
  })

  it('로그인 요청 중에는 제출을 막고 진행 상태를 알린다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, async () => {
        await delay(100)
        return HttpResponse.json({
          user: { id: 'u1', name: '루퍼스', email: EMAIL },
        })
      }),
    )
    const { user } = renderLoginForm()

    await fillAndSubmit(user)

    expect(screen.getByRole('button', { name: '로그인 중' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('로그인 중')
    await vi.waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/')
    })
  })

  it('만료된 세션 안내를 표시한다', () => {
    renderLoginForm({ reason: 'expired' })

    expect(
      screen.getByText('세션이 만료되었습니다. 다시 로그인해주세요.'),
    ).toBeInTheDocument()
  })
})
