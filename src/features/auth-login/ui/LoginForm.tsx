'use client';

import { useLoginForm } from '@/features/auth-login/model/useLoginForm';

type Props = {
  redirect: string | null;
  expired: boolean;
};

export function LoginForm({ redirect, expired }: Props) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
    isPending,
    errorMessage,
  } = useLoginForm({ redirect });

  return (
    <form className="week09-auth-form" onSubmit={handleSubmit}>
      {expired && (
        <p className="week05-error" role="status">
          세션이 만료되었습니다. 다시 로그인해주세요.
        </p>
      )}

      <label>
        <span>이메일</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label>
        <span>비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {errorMessage && (
        <p className="week05-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
