'use client';

import type { FormEvent } from 'react';

import { resolveAuthGuide } from '../model/resolveAuthGuide';
import { useLogin } from '../model/useLogin';

type LoginPageProps = {
  /** proxy 또는 401 인터셉터가 붙인 사유. required = 미로그인, expired = 세션 만료. */
  reason?: string;
  /** 로그인 후 돌아갈 경로. 검증에 실패하면 무시하고 / 로 보낸다. */
  returnTo?: string;
};

/**
 * 로그인 화면.
 *
 * 제출·이동·계측은 useLogin 이 갖는다. 이 파일은 무엇을 보여줄지만 정한다.
 */
export function LoginPage({ reason, returnTo }: LoginPageProps) {
  const login = useLogin(returnTo);

  const guideMessage = resolveAuthGuide(reason);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // FormData 로 읽는다. elements.namedItem 은 반환 타입이 넓어 as 단언을 부른다.
    const formData = new FormData(event.currentTarget);

    login.mutate({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });
  };

  return (
    <section className="week05-section">
      <h1>로그인</h1>

      {guideMessage !== null && <p role="status">{guideMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">이메일</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required />
        </div>

        <div>
          <label htmlFor="login-password">비밀번호</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </div>

        {login.isError && <p role="alert">{login.error.message}</p>}

        <button type="submit" disabled={login.isPending}>
          {login.isPending ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </section>
  );
}
