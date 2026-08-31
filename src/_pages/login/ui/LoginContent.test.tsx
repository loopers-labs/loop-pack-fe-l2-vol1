// @vitest-environment jsdom

import '@/test/setupDom';
import '@/test/setupMsw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/msw/server';
import { LoginContent } from './LoginContent';

const navigation = vi.hoisted(() => ({
  replaceDocumentLocation: vi.fn(),
}));

vi.mock('@/shared/lib/browserNavigation', () => navigation);

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginContent returnTo="/orders/new" />
    </QueryClientProvider>,
  );
}

describe('LoginContent', () => {
  beforeEach(() => {
    navigation.replaceDocumentLocation.mockReset();
  });

  it('잘못된 자격 증명 메시지를 폼 안에 표시하고 오류로 포커스를 옮긴다', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json(
          { message: '이메일 또는 비밀번호를 확인해주세요.' },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderLogin();
    await user.clear(screen.getByLabelText('비밀번호'));
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('이메일 또는 비밀번호를 확인해주세요.');
    expect(alert).toHaveFocus();
    expect(navigation.replaceDocumentLocation).not.toHaveBeenCalled();
  });

  it('로그인 성공 후 요청했던 보호 경로로 이동하고 서버 UI를 갱신한다', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({
          user: {
            id: 'u1',
            name: '루퍼1',
            email: 'looper1@loopers.dev',
          },
        }),
      ),
    );
    const user = userEvent.setup();

    renderLogin();
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(navigation.replaceDocumentLocation).toHaveBeenCalledWith(
      '/orders/new',
    );
  });
});
