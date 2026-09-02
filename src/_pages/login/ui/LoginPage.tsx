import {
  createLoader,
  parseAsString,
  parseAsStringLiteral,
  type SearchParams,
} from 'nuqs/server';

import { toLoginFrom } from '@/analytics/events';
import {
  LOGIN_REASON_MESSAGE,
  LOGIN_REASONS,
  LoginForm,
} from '@/features/auth';

const loadLoginParams = createLoader({
  next: parseAsString,
  reason: parseAsStringLiteral(LOGIN_REASONS),
  from: parseAsString,
});

export async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const {
    next: redirectPathAfterLogin,
    reason,
    from,
  } = await loadLoginParams(searchParams);

  return (
    <section className="week05-section" aria-labelledby="login-title">
      <h1 id="login-title">로그인</h1>
      {reason && <p role="status">{LOGIN_REASON_MESSAGE[reason]}</p>}
      <LoginForm
        redirectPathAfterLogin={redirectPathAfterLogin}
        from={toLoginFrom(from)}
      />
    </section>
  );
}
