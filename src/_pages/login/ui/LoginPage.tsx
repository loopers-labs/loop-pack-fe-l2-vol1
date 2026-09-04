import { LoginForm } from "@/features/auth";

// 계정 안내는 mock 백엔드가 8개를 고정으로 들고 있어서 화면에 적어 둔다.
// 실제 서비스라면 없을 블록이다.
export function LoginPage({ nextPath }: { nextPath: string | null }) {
  return (
    <main className="shop-page">
      <h1>로그인</h1>
      <LoginForm nextPath={nextPath} />
      <p className="shop-hint">
        테스트 계정 <code>looper1@loopers.dev</code> ~ <code>looper8@loopers.dev</code> · 비밀번호{" "}
        <code>looper1234</code>
      </p>
    </main>
  );
}
