import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LogoutButton } from './LogoutButton';

import { useSessionUser } from '@/entities/session';
import { getQueryClient } from '@/shared/get-query-client';
import { SESSION_USER } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

// 헤더처럼 로그인 상태일 때만 버튼을 그린다. 성공 처리 도중 버튼이 언마운트돼도 이동까지 끝나야 한다.
function SessionMenu() {
  const user = useSessionUser();

  if (!user) return <p>비로그인</p>;

  return (
    <>
      <p>{`${user.name} 로그인됨`}</p>
      <LogoutButton />
    </>
  );
}

const renderLogoutButton = () =>
  renderWithProviders(<SessionMenu />, {
    queryClient: getQueryClient(),
    initialUser: SESSION_USER,
  });

const failLogout = () =>
  server.use(
    http.post('*/api/auth/logout', () =>
      HttpResponse.json(
        { message: '로그아웃에 실패했습니다.' },
        { status: 500 },
      ),
    ),
  );

// restoreMocks는 vi.fn()의 호출 기록을 지우지 않으므로 router 호출을 직접 비운다.
afterEach(() => {
  getQueryClient().clear();
  vi.clearAllMocks();
});

describe('LogoutButton', () => {
  it('로그아웃이 성공하면 세션 사용자를 비우고 홈으로 이동한다', async () => {
    const { user } = renderLogoutButton();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByText('비로그인')).toBeInTheDocument();
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('요청 중에는 버튼을 비활성화해 중복 요청을 막는다', async () => {
    const { promise: responseAllowed, resolve: allowResponse } =
      Promise.withResolvers<void>();

    server.use(
      http.post('*/api/auth/logout', async () => {
        await responseAllowed;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderLogoutButton();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeDisabled();

    allowResponse();

    expect(await screen.findByText('비로그인')).toBeInTheDocument();
  });

  it('요청이 실패하면 세션과 위치를 유지하고 오류를 표시한다', async () => {
    failLogout();
    const { user } = renderLogoutButton();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그아웃에 실패했습니다.',
    );
    expect(
      screen.getByText(`${SESSION_USER.name} 로그인됨`),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
