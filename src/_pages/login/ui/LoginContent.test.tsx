// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { LoginContent } from './LoginContent';

const VALID_EMAIL = 'looper1@loopers.dev';
const VALID_PASSWORD = 'looper1234';

const navigation = vi.hoisted(() => ({
  replaceDocumentLocation: vi.fn(),
}));
const analytics = vi.hoisted(() => ({
  identifyAnalyticsUser: vi.fn(),
  trackLoginFail: vi.fn(),
  trackLoginStart: vi.fn(),
  trackLoginSuccess: vi.fn(),
}));

vi.mock('@/shared/lib/browserNavigation', () => navigation);
vi.mock('@/analytics/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/analytics/events')>()),
  ...analytics,
}));

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginContent returnTo="/orders/new" loginFrom="cart" />
    </QueryClientProvider>,
  );
}

describe('LoginContent', () => {
  beforeEach(() => {
    navigation.replaceDocumentLocation.mockReset();
    Object.values(analytics).forEach((mock) => mock.mockReset());
  });

  it('빈 폼은 자격 증명을 미리 채우거나 로그인 요청을 보내지 않는다', async () => {
    const loginRequest = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => {
        loginRequest();
        return HttpResponse.json({ message: '호출되면 안 됩니다.' });
      }),
    );
    const user = userEvent.setup();

    renderLogin();

    const emailInput = screen.getByLabelText('이메일');
    const passwordInput = screen.getByLabelText('비밀번호');

    expect(emailInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(emailInput).toBeInvalid();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('이메일만 입력한 폼은 비밀번호 검증에서 멈추고 로그인 요청을 보내지 않는다', async () => {
    const loginRequest = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => {
        loginRequest();
        return HttpResponse.json({ message: '호출되면 안 됩니다.' });
      }),
    );
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByLabelText('이메일'), VALID_EMAIL);
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(screen.getByLabelText('비밀번호')).toBeInvalid();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('잘못된 자격 증명 메시지를 폼 안에 표시하고 오류로 포커스를 옮긴다', async () => {
    let receivedBody: unknown;
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          { message: '이메일 또는 비밀번호를 확인해주세요.' },
          { status: 401 },
        );
      }),
    );
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByLabelText('이메일'), VALID_EMAIL);
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    const alert = await screen.findByRole('alert');
    expect(receivedBody).toEqual({
      email: VALID_EMAIL,
      password: 'wrong-password',
    });
    expect(alert).toHaveTextContent('이메일 또는 비밀번호를 확인해주세요.');
    expect(alert).toHaveFocus();
    expect(navigation.replaceDocumentLocation).not.toHaveBeenCalled();
    expect(analytics.trackLoginStart).toHaveBeenCalledWith('cart');
    expect(analytics.trackLoginFail).toHaveBeenCalledWith(
      'cart',
      'INVALID_CREDENTIALS',
    );
  });

  it('로그인 성공 후 요청했던 보호 경로로 이동하고 서버 UI를 갱신한다', async () => {
    let receivedBody: unknown;
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          user: {
            id: 'u1',
            name: '루퍼1',
            email: VALID_EMAIL,
          },
        });
      }),
    );
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByLabelText('이메일'), VALID_EMAIL);
    await user.type(screen.getByLabelText('비밀번호'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(navigation.replaceDocumentLocation).toHaveBeenCalledWith(
        '/orders/new',
      );
    });
    expect(receivedBody).toEqual({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
    expect(analytics.identifyAnalyticsUser).toHaveBeenCalledWith('u1');
    expect(analytics.trackLoginSuccess).toHaveBeenCalledWith('cart');
    expect(
      analytics.identifyAnalyticsUser.mock.invocationCallOrder[0],
    ).toBeLessThan(analytics.trackLoginSuccess.mock.invocationCallOrder[0]);
  });
});
