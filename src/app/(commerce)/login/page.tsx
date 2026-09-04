import { LoginForm } from "@/features/auth/ui/LoginForm";
import styles from "@/shared/ui/focused-page.module.css";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 공개 경로(proxy 매처 밖). proxy가 실어 보낸 redirect를 읽어 폼에 넘긴다.
// 검증은 폼이 로그인 성공 시 safeRedirect로 하므로 여기선 문자열 추출만 한다.
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirect = typeof params.redirect === "string" ? params.redirect : null;

  return (
    <section className={styles.page}>
      <h1>로그인</h1>
      <LoginForm redirect={redirect} />
    </section>
  );
}
