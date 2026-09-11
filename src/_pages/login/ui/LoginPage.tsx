import { LoginForm } from '@/features/login/ui/LoginForm';

export function LoginPage({ redirectTo }: { redirectTo: string }) {
  return (
    <main>
      <section className="week05-section">
        <h1>로그인</h1>
        <LoginForm redirectTo={redirectTo} />
      </section>
    </main>
  );
}
