'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { SubmitEvent } from 'react';

import { loginMutationOptions } from '../api/mutations';
import { toSafeNextPath } from '../model/login-url';

import { useSessionActions } from '@/entities/session';

export function LoginForm({
  redirectPathAfterLogin,
}: {
  redirectPathAfterLogin: string | null;
}) {
  const router = useRouter();
  const { setUser } = useSessionActions();
  const { mutate, isPending, error } = useMutation({
    ...loginMutationOptions,
    onSuccess: ({ user }) => {
      setUser(user);
      router.replace(toSafeNextPath(redirectPathAfterLogin));
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
