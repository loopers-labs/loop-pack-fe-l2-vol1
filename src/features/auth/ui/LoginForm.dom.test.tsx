import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from './LoginForm';

import { useSessionUser } from '@/entities/session';
import { getQueryClient } from '@/shared/get-query-client';
import { SESSION_PASSWORD, SESSION_USER } from '@tests/msw/fixtures';
import { server } from '@tests/msw/server';
import { renderWithProviders } from '@tests/render-with-providers';

const router = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

// 로그인되면 폼이 사라지는 화면을 흉내 낸다. 성공 처리 도중 폼이 언마운트돼도 이동까지 끝나야 한다.
function LoginScreen() {
  const user = useSessionUser();

  if (user) return <p>{`${user.name} 로그인됨`}</p>;

  return (
    <>
      <p>비로그인</p>
      <LoginForm redirectPathAfterLogin="/my" from="direct" />
    </>
  );
}

// 401을 경계로 던지는 앱 정책이 그대로 적용돼야 로그인 폼의 예외(throwOnError: false)를 검증할 수 있다.
const renderLoginForm = () =>
  renderWithProviders(<LoginScreen />, { queryClient: getQueryClient() });

// 재제출도 같은 헬퍼로 하므로 이전 입력을 비운 뒤 채운다.
const submitLogin = async (
  user: ReturnType<typeof renderLoginForm>['user'],
  password = SESSION_PASSWORD,
) => {
  await user.clear(screen.getByLabelText('이메일'));
  await user.type(screen.getByLabelText('이메일'), SESSION_USER.email);
  await user.clear(screen.getByLabelText('비밀번호'));
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '로그인' }));
};

const failLoginWithServerError = () =>
  server.use(
    http.post('*/api/auth/login', () =>
      HttpResponse.json({ message: '로그인에 실패했습니다.' }, { status: 500 }),
    ),
  );

// restoreMocks는 vi.fn()의 호출 기록을 지우지 않으므로 router 호출을 직접 비운다.
afterEach(() => {
  getQueryClient().clear();
  vi.clearAllMocks();
});

describe('LoginForm', () => {
  it('로그인에 성공하면 세션 사용자를 설정하고, 폼이 사라져도 로그인 후 경로로 돌아간다', async () => {
    const { user } = renderLoginForm();

    await submitLogin(user);

    expect(
      await screen.findByText(`${SESSION_USER.name} 로그인됨`),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/my');
    });
  });

  it('잘못된 자격 증명(401)은 폼에 표시하고 비로그인 상태와 위치를 유지한다', async () => {
    const { user } = renderLoginForm();

    await submitLogin(user, 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이메일 또는 비밀번호를 확인해주세요.',
    );
    expect(screen.getByText('비로그인')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();

    // 값을 고쳐 다시 제출할 수 있다
    await submitLogin(user);

    expect(
      await screen.findByText(`${SESSION_USER.name} 로그인됨`),
    ).toBeInTheDocument();
  });

  it('로그인 API가 500을 반환하면 오류를 표시하고 사용자 상태와 위치를 유지한다', async () => {
    failLoginWithServerError();
    const { user } = renderLoginForm();

    await submitLogin(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인에 실패했습니다.',
    );
    expect(screen.getByText('비로그인')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('요청 중에는 버튼을 비활성화해 중복 제출을 막는다', async () => {
    const { promise: responseAllowed, resolve: allowResponse } =
      Promise.withResolvers<void>();

    server.use(
      http.post('*/api/auth/login', async () => {
        await responseAllowed;

        return HttpResponse.json({ user: SESSION_USER });
      }),
    );
    const { user } = renderLoginForm();

    await submitLogin(user);

    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();

    allowResponse();

    expect(
      await screen.findByText(`${SESSION_USER.name} 로그인됨`),
    ).toBeInTheDocument();
  });
});
