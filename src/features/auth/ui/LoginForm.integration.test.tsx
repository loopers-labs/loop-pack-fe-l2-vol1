import '@/test/setup/msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, delay, http } from 'msw'
import {
  act,
  fireEvent,
  render,
  screen,
  type RenderResult,
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  identifyUser,
  trackLoginFail,
  trackLoginStart,
  trackLoginSuccess,
} from '@/analytics/events'
import { PRIVATE_ORDER_QUERY_KEY } from '@/entities/order'
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

vi.mock('@/analytics/events', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/analytics/events')>()

  return {
    ...actual,
    identifyUser: vi.fn(),
    trackLoginFail: vi.fn(),
    trackLoginStart: vi.fn(),
    trackLoginSuccess: vi.fn(),
  }
})

const mockedIdentifyUser = vi.mocked(identifyUser)
const mockedTrackLoginFail = vi.mocked(trackLoginFail)
const mockedTrackLoginStart = vi.mocked(trackLoginStart)
const mockedTrackLoginSuccess = vi.mocked(trackLoginSuccess)

interface RenderLoginFormResult extends RenderResult {
  queryClient: QueryClient
  user: UserEvent
}

function renderLoginForm(
  props: { returnTo?: string; reason?: string } = {},
): RenderLoginFormResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    queryClient,
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <LoginForm {...props} />
      </QueryClientProvider>,
    ),
  }
}

function renderStrictLoginForm(
  props: { returnTo?: string; reason?: string } = {},
): RenderLoginFormResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    queryClient,
    user: userEvent.setup(),
    ...render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <LoginForm {...props} />
        </QueryClientProvider>
      </StrictMode>,
    ),
  }
}

interface OverlappingLoginForms {
  first: HTMLFormElement
  second: HTMLFormElement
}

function renderOverlappingLoginForms(): OverlappingLoginForms {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm returnTo="/checkout" />
      <LoginForm returnTo="/orders" />
    </QueryClientProvider>,
  )
  const [first, second] = Array.from(document.querySelectorAll('form'))
  if (first === undefined || second === undefined) {
    throw new Error('Overlapping login forms were not rendered.')
  }

  return { first, second }
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
    vi.clearAllMocks()
    delete window.__analytics
  })

  it('records one Strict Mode login start, then success and identity before navigation', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json({
          user: { id: 'u1', name: 'Analytics member', email: EMAIL },
        }),
      ),
    )
    const { user } = renderStrictLoginForm({ returnTo: '/checkout?coupon=x' })

    await vi.waitFor(() => {
      expect(mockedTrackLoginStart).toHaveBeenCalledOnce()
      expect(mockedTrackLoginStart).toHaveBeenCalledWith({ from: 'cart' })
    })
    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
      expect(mockedTrackLoginSuccess).toHaveBeenCalledWith({ from: 'cart' })
      expect(mockedIdentifyUser).toHaveBeenCalledOnce()
      expect(mockedIdentifyUser).toHaveBeenCalledWith('u1')
      expect(router.replace).toHaveBeenCalledWith('/checkout?coupon=x')
      expect(router.refresh).toHaveBeenCalledOnce()
    })
    const startOrder = mockedTrackLoginStart.mock.invocationCallOrder[0]
    const successOrder = mockedTrackLoginSuccess.mock.invocationCallOrder[0]
    const identifyOrder = mockedIdentifyUser.mock.invocationCallOrder[0]
    const replaceOrder = router.replace.mock.invocationCallOrder[0]
    const refreshOrder = router.refresh.mock.invocationCallOrder[0]

    if (
      startOrder === undefined ||
      successOrder === undefined ||
      identifyOrder === undefined ||
      replaceOrder === undefined ||
      refreshOrder === undefined
    ) {
      throw new Error('Login analytics side effects were not recorded.')
    }
    expect(startOrder).toBeLessThan(successOrder)
    expect(successOrder).toBeLessThan(identifyOrder)
    expect(identifyOrder).toBeLessThan(replaceOrder)
    expect(replaceOrder).toBeLessThan(refreshOrder)
    expect(window.__analytics).toBeUndefined()
  })

  it('keeps login analytics source stable when returnTo changes before submission', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json({
          user: { id: 'u1', name: 'Analytics member', email: EMAIL },
        }),
      ),
    )
    const { queryClient, rerender, user } = renderLoginForm({
      returnTo: '/checkout',
    })

    await vi.waitFor(() => {
      expect(mockedTrackLoginStart).toHaveBeenCalledExactlyOnceWith({
        from: 'cart',
      })
    })
    rerender(
      <QueryClientProvider client={queryClient}>
        <LoginForm returnTo="/orders" />
      </QueryClientProvider>,
    )

    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(mockedTrackLoginSuccess).toHaveBeenCalledExactlyOnceWith({
        from: 'cart',
      })
    })
    expect(router.replace).toHaveBeenCalledWith('/orders')
  })

  it.each([
    [400, 'Invalid request', 'INVALID_REQUEST', 400],
    [401, 'Invalid credentials', 'INVALID_CREDENTIALS', 401],
    [500, 'Server error', 'SERVER_ERROR', 500],
  ] as const)(
    'records the normalized %i login failure without identifying or navigating',
    async (status, message, reason, expectedStatus) => {
      server.use(
        http.post(LOGIN_ENDPOINT, () =>
          HttpResponse.json({ message }, { status }),
        ),
      )
      const { user } = renderLoginForm()

      await fillAndSubmit(user)

      await vi.waitFor(() => {
        expect(mockedTrackLoginFail).toHaveBeenCalledOnce()
        expect(mockedTrackLoginFail).toHaveBeenCalledWith({
          reason,
          status: expectedStatus,
        })
      })
      expect(mockedTrackLoginStart).toHaveBeenCalledOnce()
      expect(mockedTrackLoginStart).toHaveBeenCalledWith({ from: 'direct' })
      expect(mockedTrackLoginSuccess).not.toHaveBeenCalled()
      expect(mockedIdentifyUser).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
      expect(router.refresh).not.toHaveBeenCalled()
    },
  )

  it('records an unknown login failure for a network error without exposing credentials', async () => {
    server.use(http.post(LOGIN_ENDPOINT, () => HttpResponse.error()))
    const { user } = renderLoginForm()

    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(mockedTrackLoginFail).toHaveBeenCalledOnce()
      expect(mockedTrackLoginFail).toHaveBeenCalledWith({
        reason: 'UNKNOWN',
        status: null,
      })
    })
    expect(window.__analytics).toBeUndefined()
  })

  it('allows only the newer overlapping login success to identify and navigate', async () => {
    let requestCount = 0
    let releaseFirstResponse: (() => void) | undefined
    let releaseSecondResponse: (() => void) | undefined
    let markFirstHandlerReturned: (() => void) | undefined
    const firstResponseGate = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve
    })
    const secondResponseGate = new Promise<void>((resolve) => {
      releaseSecondResponse = resolve
    })
    const firstHandlerReturned = new Promise<void>((resolve) => {
      markFirstHandlerReturned = resolve
    })
    server.use(
      http.post(LOGIN_ENDPOINT, async () => {
        requestCount += 1
        if (requestCount === 1) {
          await firstResponseGate
          markFirstHandlerReturned?.()
          return HttpResponse.json({
            user: { id: 'u-a', name: 'First member', email: EMAIL },
          })
        }

        await secondResponseGate
        return HttpResponse.json({
          user: { id: 'u-b', name: 'Second member', email: EMAIL },
        })
      }),
    )
    const forms = renderOverlappingLoginForms()

    fireEvent.submit(forms.first)
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })
    fireEvent.submit(forms.second)
    await vi.waitFor(() => {
      expect(requestCount).toBe(2)
    })

    releaseSecondResponse?.()
    await vi.waitFor(() => {
      expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
      expect(mockedTrackLoginSuccess).toHaveBeenCalledWith({ from: 'orders' })
      expect(mockedIdentifyUser).toHaveBeenCalledOnce()
      expect(mockedIdentifyUser).toHaveBeenCalledWith('u-b')
      expect(router.replace).toHaveBeenCalledOnce()
      expect(router.replace).toHaveBeenCalledWith('/orders')
      expect(router.refresh).toHaveBeenCalledOnce()
    })

    await act(async () => {
      releaseFirstResponse?.()
      await firstHandlerReturned
    })

    expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
    expect(mockedIdentifyUser).toHaveBeenCalledOnce()
    expect(router.replace).toHaveBeenCalledOnce()
    expect(router.refresh).toHaveBeenCalledOnce()
  })

  it('suppresses an older overlapping login failure after a newer success', async () => {
    let requestCount = 0
    let releaseFirstResponse: (() => void) | undefined
    let releaseSecondResponse: (() => void) | undefined
    let markFirstHandlerReturned: (() => void) | undefined
    const firstResponseGate = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve
    })
    const secondResponseGate = new Promise<void>((resolve) => {
      releaseSecondResponse = resolve
    })
    const firstHandlerReturned = new Promise<void>((resolve) => {
      markFirstHandlerReturned = resolve
    })
    server.use(
      http.post(LOGIN_ENDPOINT, async () => {
        requestCount += 1
        if (requestCount === 1) {
          await firstResponseGate
          markFirstHandlerReturned?.()
          return HttpResponse.json(
            { message: 'First login failed' },
            { status: 401 },
          )
        }

        await secondResponseGate
        return HttpResponse.json({
          user: { id: 'u-b', name: 'Second member', email: EMAIL },
        })
      }),
    )
    const forms = renderOverlappingLoginForms()

    fireEvent.submit(forms.first)
    await vi.waitFor(() => {
      expect(requestCount).toBe(1)
    })
    fireEvent.submit(forms.second)
    await vi.waitFor(() => {
      expect(requestCount).toBe(2)
    })

    releaseSecondResponse?.()
    await vi.waitFor(() => {
      expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
      expect(mockedIdentifyUser).toHaveBeenCalledOnce()
    })

    await act(async () => {
      releaseFirstResponse?.()
      await firstHandlerReturned
    })

    expect(mockedTrackLoginFail).not.toHaveBeenCalled()
    expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
    expect(mockedIdentifyUser).toHaveBeenCalledOnce()
    expect(router.replace).toHaveBeenCalledOnce()
    expect(router.refresh).toHaveBeenCalledOnce()
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
    expect(router.refresh).toHaveBeenCalledOnce()
    expect(router.replace.mock.invocationCallOrder[0]).toBeLessThan(
      router.refresh.mock.invocationCallOrder[0],
    )
  })

  it('로그인 성공 후 이동하기 전에 이전 사용자의 주문 캐시를 제거한다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json({
          user: { id: 'u2', name: '새 사용자', email: EMAIL },
        }),
      ),
    )
    const { queryClient, user } = renderLoginForm({ returnTo: '/orders' })
    queryClient.setQueryData(PRIVATE_ORDER_QUERY_KEY, [
      {
        id: 'order-from-previous-user',
        createdAt: '2026-09-02T12:00:00.000Z',
        items: [{ productId: 'p1', quantity: 1 }],
      },
    ])

    await fillAndSubmit(user)

    await vi.waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/orders')
    })
    expect(queryClient.getQueryData(PRIVATE_ORDER_QUERY_KEY)).toBeUndefined()
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

  it('같은 틱에 폼이 두 번 제출되어도 로그인 요청은 한 번만 보낸다', async () => {
    let requestCount = 0
    server.use(
      http.post(LOGIN_ENDPOINT, async () => {
        requestCount += 1
        await delay(100)
        return HttpResponse.json({
          user: { id: 'u1', name: '루퍼스', email: EMAIL },
        })
      }),
    )
    const { user } = renderLoginForm({ returnTo: '/checkout' })
    await user.type(screen.getByLabelText('이메일'), EMAIL)
    await user.type(screen.getByLabelText('비밀번호'), PASSWORD)
    const form = screen.getByLabelText('이메일').closest('form')
    if (form === null) {
      throw new Error('로그인 폼을 찾을 수 없습니다.')
    }

    fireEvent.submit(form)
    fireEvent.submit(form)

    await vi.waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/checkout')
    })
    expect(requestCount).toBe(1)
    expect(mockedTrackLoginSuccess).toHaveBeenCalledOnce()
    expect(mockedTrackLoginSuccess).toHaveBeenCalledWith({ from: 'cart' })
    expect(mockedIdentifyUser).toHaveBeenCalledOnce()
    expect(mockedIdentifyUser).toHaveBeenCalledWith('u1')
  })

  it('records one failure event when duplicate native submits receive a login failure', async () => {
    let requestCount = 0
    server.use(
      http.post(LOGIN_ENDPOINT, async () => {
        requestCount += 1
        await delay(100)
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 },
        )
      }),
    )
    const { user } = renderLoginForm({ returnTo: '/checkout' })
    const emailInput = document.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )
    const passwordInput = document.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )
    const form = document.querySelector('form')
    if (emailInput === null || passwordInput === null || form === null) {
      throw new Error('Login form was not found.')
    }

    await user.type(emailInput, EMAIL)
    await user.type(passwordInput, PASSWORD)

    fireEvent.submit(form)
    fireEvent.submit(form)

    await vi.waitFor(() => {
      expect(mockedTrackLoginFail).toHaveBeenCalledOnce()
      expect(mockedTrackLoginFail).toHaveBeenCalledWith({
        reason: 'INVALID_CREDENTIALS',
        status: 401,
      })
    })
    expect(requestCount).toBe(1)
    expect(mockedTrackLoginSuccess).not.toHaveBeenCalled()
    expect(mockedIdentifyUser).not.toHaveBeenCalled()
  })

  it('로그인 요청 중 화면을 떠나면 완료 후 이전 경로로 이동시키지 않는다', async () => {
    let requestSignal: AbortSignal | undefined
    let releaseResponse: (() => void) | undefined
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    server.use(
      http.post(LOGIN_ENDPOINT, async ({ request }) => {
        requestSignal = request.signal
        await responseGate
        return HttpResponse.json({
          user: { id: 'u1', name: '루퍼스', email: EMAIL },
        })
      }),
    )
    const { unmount, user } = renderLoginForm({ returnTo: '/orders' })

    await fillAndSubmit(user)
    await vi.waitFor(() => expect(requestSignal).toBeDefined())
    unmount()
    expect(requestSignal?.aborted).toBe(true)
    releaseResponse?.()
    await Promise.resolve()

    expect(mockedTrackLoginStart).toHaveBeenCalledOnce()
    expect(mockedTrackLoginStart).toHaveBeenCalledWith({ from: 'orders' })
    expect(mockedTrackLoginSuccess).not.toHaveBeenCalled()
    expect(mockedTrackLoginFail).not.toHaveBeenCalled()
    expect(mockedIdentifyUser).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('400이면 요청 오류를 표시하고 폼에 머문다', async () => {
    server.use(
      http.post(LOGIN_ENDPOINT, () =>
        HttpResponse.json(
          { message: '요청 형식을 확인해주세요.' },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderLoginForm()

    await fillAndSubmit(user)

    expect(
      await screen.findByText('요청 형식을 확인해주세요.'),
    ).toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
    expect(router.refresh).not.toHaveBeenCalled()
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
    expect(router.refresh).not.toHaveBeenCalled()
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
    expect(router.refresh).not.toHaveBeenCalled()
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
