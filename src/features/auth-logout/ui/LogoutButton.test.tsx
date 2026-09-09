import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../test/msw/server';

vi.mock('next/navigation', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

const { LogoutButton } = await import('./LogoutButton');

/**
 * 로그아웃이 실패했을 때 사용자가 이유를 알 수 있는지 본다.
 *
 * 실패하면 세션과 담은 목록을 그대로 두는 것이 정책이라, 화면은 아무것도 바뀌지 않는다.
 * 안내가 없으면 사용자는 눌렀는데 왜 그대로인지 알 방법이 없다.
 */

function renderLogoutButton() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  render(<LogoutButton />, { wrapper });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('로그아웃 실패 안내', () => {
  it('서버가 실패로 답하면 이유를 화면에 보여준다', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 })));
    renderLogoutButton();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다'),
    );
  });

  // fetch 자체가 실패하면 error.message가 브라우저 원문("Failed to fetch")이 된다.
  // 화면이 그 값을 그대로 쓰므로 사용자에게 보일 문구로 바꿔야 한다
  it('요청을 보내지 못해도 사용자에게 보일 문구로 안내한다', async () => {
    server.use(http.post('*/api/auth/logout', () => HttpResponse.error()));
    renderLogoutButton();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('로그아웃하지 못했습니다'),
    );
  });

  it('성공하면 안내를 보여주지 않는다', async () => {
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    renderLogoutButton();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
