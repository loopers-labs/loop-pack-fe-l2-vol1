'use client';

import type { FormEvent } from 'react';

import { apiClient } from '@/shared/api/apiClient';
import { isSafeRedirect } from '@/shared/lib/isSafeRedirect';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { resolveAuthGuide } from '../config/authGuide';
import type { LoginRequest, LoginResponse } from '../model/types';

type LoginPageProps = {
  /** proxy 또는 401 인터셉터가 붙인 사유. required = 미로그인, expired = 세션 만료. */
  reason?: string;
  /** 로그인 후 돌아갈 경로. 검증에 실패하면 무시하고 / 로 보낸다. */
  returnTo?: string;
};

/**
 * 로그인.
 *
 * 제출 상태를 useState 로 따로 들지 않는다. isPending 도 실패 메시지도 요청 하나에서
 * 파생되는 값이라 useMutation 이 이미 갖고 있다. 두 벌로 들면 초기화를 빠뜨렸을 때
 * 이전 실패 메시지가 다음 시도에 남는 식으로 어긋난다.
 */
export function LoginPage({ reason, returnTo }: LoginPageProps) {
  const router = useRouter();

  const login = useMutation({
    mutationFn: (credentials: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', credentials),
    onSuccess: () => {
      // 검증에 실패한 returnTo 는 조용히 버리고 홈으로 보낸다. 외부 주소로 나가지 않게 하는 지점이다.
      //
      // push 가 아니라 replace 다. push 면 로그인 화면이 히스토리에 남아, 이동한 뒤 뒤로 가기를
      // 누르면 세션이 살아 있는데도 로그인 폼이 다시 뜬다. 로그인은 지나가는 관문이지
      // 돌아갈 목적지가 아니다.
      router.replace(returnTo !== undefined && isSafeRedirect(returnTo) ? returnTo : '/');
      // 서버 컴포넌트가 새 세션 쿠키로 헤더를 다시 그리게 한다.
      router.refresh();
    },
  });

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
