'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useLogin } from '../model/useLogin';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useLogin();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutate(
      { email, password },
      {
        // replace: 뒤로 가기로 로그인 화면에 되돌아오지 않게 한다.
        // redirectTo는 서버(page.tsx)에서 이미 검증된 값이다 (RFC D4).
        onSuccess: () => router.replace(redirectTo),
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
