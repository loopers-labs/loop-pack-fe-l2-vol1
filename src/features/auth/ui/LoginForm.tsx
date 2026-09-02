'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, type SubmitEvent } from 'react';

import { loginMutationOptions } from '../api/mutations';
import { toSafeNextPath } from '../model/login-url';

import {
  identify,
  toLoginFailReason,
  trackEvent,
  type LoginFrom,
} from '@/analytics/events';
import { useSessionActions } from '@/entities/session';

export function LoginForm({
  redirectPathAfterLogin,
  from,
}: {
  redirectPathAfterLogin: string | null;
  from: LoginFrom;
}) {
  const router = useRouter();
  const { setUser } = useSessionActions();

  useEffect(() => {
    trackEvent('login_start', { from });
  }, [from]);

  const { mutate, isPending, error } = useMutation({
    ...loginMutationOptions,
    onSuccess: ({ user }) => {
      identify(user.id);
      trackEvent('login_success', { from });
      setUser(user);
      router.replace(toSafeNextPath(redirectPathAfterLogin));
    },
    onError: (loginError) => {
      trackEvent('login_fail', { reason: toLoginFailReason(loginError) });
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    mutate({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    });
  };

  return (
    <form className="week05-form" aria-label="로그인" onSubmit={handleSubmit}>
      <label>
        이메일
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        비밀번호
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p role="alert">{error.message}</p>}
      <button type="submit" disabled={isPending}>
        로그인
      </button>
    </form>
  );
}
