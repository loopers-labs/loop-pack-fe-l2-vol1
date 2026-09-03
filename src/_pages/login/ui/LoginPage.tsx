import { LoginForm } from '@/features/auth-login/ui/LoginForm';

type Props = {
  redirect: string | null;
  reason: string | null;
};

export function LoginPage({ redirect, reason }: Props) {
  return (
    <section className="week05-section week09-auth-page">
      <h1>로그인</h1>
      <LoginForm redirect={redirect} expired={reason === 'expired'} />
    </section>
  );
}
