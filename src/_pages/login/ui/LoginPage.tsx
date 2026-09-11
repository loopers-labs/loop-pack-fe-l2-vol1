"use client";
import { useEffect } from "react";
import { LoginForm } from "@/features/auth";
import { EVENT, trackEvent } from "@/shared/analytics";
import { safeNextPath } from "@/shared/lib/safeNextPath";

// 계정 안내는 mock 백엔드가 8개를 고정으로 들고 있어서 화면에 적어 둔다.
// 실제 서비스라면 없을 블록이다.
export function LoginPage({ nextPath }: { nextPath: string | null }) {
  const from = safeNextPath(nextPath);

  // 화면 진입은 사용자 액션이 아니라 사실이라 effect가 맞다.
  // from을 함께 보내야 "어디서 막혀 로그인으로 왔는가"를 셀 수 있고,
  // 그게 3단계에서 인증을 필수 E2E로 두는 근거가 된다.
  useEffect(() => {
    trackEvent(EVENT.loginStart, { from });
  }, [from]);

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
