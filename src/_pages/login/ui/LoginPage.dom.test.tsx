import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginPage } from './LoginPage';

import { getQueryClient } from '@/shared/get-query-client';
import { SESSION_PASSWORD, SESSION_USER } from '@tests/msw/fixtures';
import { renderWithProviders } from '@tests/render-with-providers';

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

// 서버 컴포넌트는 async 함수라 먼저 실행해 트리를 받은 뒤 렌더한다. URL query가 로더를 거쳐 폼까지 닿는지 본다.
const renderLoginPage = async (query: string) => {
  const searchParams = Object.fromEntries(new URLSearchParams(query));
  const page = await LoginPage({ searchParams: Promise.resolve(searchParams) });

  return renderWithProviders(page, { queryClient: getQueryClient() });
};

afterEach(() => {
  getQueryClient().clear();
  vi.clearAllMocks();
});

describe('로그인 페이지', () => {
  it('돌아갈 경로가 있다면 로그인 후 원래 내부 경로로 돌아간다', async () => {
    const { user } = await renderLoginPage('next=/orders?status=pending');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('이메일'), SESSION_USER.email);
    await user.type(screen.getByLabelText('비밀번호'), SESSION_PASSWORD);
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/orders?status=pending');
    });
  });

  it('세션 만료로 왔다면 안내를 보여주고 다시 로그인하면 직전 경로로 돌아간다', async () => {
    const { user } = await renderLoginPage(
      'reason=expired&next=/orders?status=pending',
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      '세션이 만료되었습니다. 다시 로그인해주세요.',
    );

    await user.type(screen.getByLabelText('이메일'), SESSION_USER.email);
    await user.type(screen.getByLabelText('비밀번호'), SESSION_PASSWORD);
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/orders?status=pending');
    });
  });
});
