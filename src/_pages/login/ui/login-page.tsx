import { LoginForm } from "@/features/auth";
import type { LoginReason } from "@/shared/lib/return-to";

type LoginPageProps = {
  returnTo: string;
  reason?: LoginReason;
};

export function LoginPage({ returnTo, reason }: LoginPageProps) {
  return (
    <section className="week05-section week09-narrow">
      <h1>로그인</h1>
      {reason === "expired" ? (
        <p role="alert" className="week09-notice">
          세션이 만료되었어요. 다시 로그인해 주세요.
        </p>
      ) : null}
      <LoginForm returnTo={returnTo} />
    </section>
  );
}
