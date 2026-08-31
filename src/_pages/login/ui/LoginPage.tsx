import {
  createLoader,
  parseAsString,
  parseAsStringLiteral,
  type SearchParams,
} from 'nuqs/server';

import {
  LOGIN_REASON_MESSAGE,
  LOGIN_REASONS,
  LoginForm,
} from '@/features/auth';

const loadLoginParams = createLoader({
  next: parseAsString,
  reason: parseAsStringLiteral(LOGIN_REASONS),
});

export async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next: redirectPathAfterLogin, reason } =
    await loadLoginParams(searchParams);

  return (
    <section className="week05-section" aria-labelledby="login-title">
      <h1 id="login-title">로그인</h1>
      {reason && <p role="status">{LOGIN_REASON_MESSAGE[reason]}</p>}
      <LoginForm redirectPathAfterLogin={redirectPathAfterLogin} />
    </section>
  );
}
