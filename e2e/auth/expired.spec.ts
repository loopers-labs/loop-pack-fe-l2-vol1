import { test, expect } from "../fixtures/auth";

// storageState 로 로그인된 세션을 갖고 시작한다 — 만료는 "있던 세션이 무효가 되는" 경계라
// 이미 로그인된 상태(storageState)가 오히려 전제다(로그인 자체를 검증하는 스펙이 아니다).
test.describe("인증 — 세션 만료 경계", () => {
  const BASE_URL = "http://localhost:3000";

  test("서버가 세션을 만료(scenario=expired)로 판정하면 보호 화면 대신 로그아웃 상태로 떨어진다", async ({
    page,
    context,
  }) => {
    // expired 노브: 세션 쿠키는 그대로 두고 서버 /api/auth/me 만 401(만료)로 응답하게 한다.
    await context.addCookies([
      { name: "scenario", value: "expired", url: BASE_URL },
    ]);

    await page.goto("/mypage");

    // 세션 확인(/me)이 401 → useSession 이 로그아웃으로 확정 → 헤더가 "로그인" 링크로 떨어지고
    // 보호 콘텐츠(로그인 사용자 이메일)는 뜨지 않는다.
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByText(/@loopers\.dev$/)).toHaveCount(0);
  });
});
