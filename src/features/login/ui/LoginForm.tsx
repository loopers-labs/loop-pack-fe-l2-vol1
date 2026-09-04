'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { sessionQueries } from '@/entities/session';
import { analyticsEvents } from '@/shared/analytics/events';
import { HttpError } from '@/shared/api/errors';
import { useLogin } from '../model/useLogin';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useLogin();

  // 어디서 왔는지(`from`)는 복원 경로다 — 직접 진입이면 'direct' (RFC A절).
  const from = redirectTo === '/' ? 'direct' : redirectTo;
  useEffect(() => {
    analyticsEvents.loginStart(from);
  }, [from]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutate(
      { email, password },
      {
        onError: (loginError) => {
          analyticsEvents.loginFail(
            loginError instanceof HttpError && loginError.status === 401
              ? 'INVALID_CREDENTIALS'
              : 'SERVER_ERROR',
          );
        },
        onSuccess: (user) => {
          analyticsEvents.loginSuccess(user.id, from);
          // 세션 캐시를 응답으로 바로 채운다 — 헤더가 이동 전에 갱신된다.
          queryClient.setQueryData(sessionQueries.me().queryKey, user);
          // replace: 뒤로 가기로 로그인 화면에 되돌아오지 않게 한다.
          // redirectTo는 서버(page.tsx)에서 이미 검증된 값이다 (RFC D4).
          router.replace(redirectTo);
          // 로그인 전에 보호 경로를 prefetch했다면 라우터 캐시에 "→ /login" 리다이렉트가 남아 있다.
          // 그대로 두면 replace가 캐시를 타고 로그인 화면으로 되돌아온다(실브라우저에서 재현). 캐시를 비운다.
          router.refresh();
        },
      },
    );
  };

  return (
    <form className="login-form" onSubmit={onSubmit} aria-busy={isPending}>
      <label>
        이메일
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p role="alert">{error.message}</p> : null}
      <button type="submit" disabled={isPending}>
        {isPending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  );
}
