'use client';

import { useState, type FormEvent } from 'react';
import { useLoginMutation } from '../api/useLoginMutation';

type LoginFormProps = {
  /** 로그인에 성공하면 이동할 경로. 호출부에서 이미 검증된 내부 경로여야 한다 */
  redirectPath: string;
};

export function LoginForm({ redirectPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLoginMutation(redirectPath);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <form className="week05-form" onSubmit={handleSubmit} noValidate>
      <label className="week05-field">
        이메일
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="week05-field">
        비밀번호
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {login.isError ? <p role="alert">{login.error.message}</p> : null}
      <button className="week05-button" type="submit" disabled={login.isPending}>
        {login.isPending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  );
}
