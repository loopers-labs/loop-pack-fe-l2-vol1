import { createLoader, parseAsString, type SearchParams } from 'nuqs/server';

import { LoginForm } from '@/features/auth';

const loadLoginParams = createLoader({ next: parseAsString });

export async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next: redirectPathAfterLogin } = await loadLoginParams(searchParams);

  return (
    <section className="week05-section" aria-labelledby="login-title">
      <h1 id="login-title">로그인</h1>
      <LoginForm redirectPathAfterLogin={redirectPathAfterLogin} />
    </section>
  );
}
