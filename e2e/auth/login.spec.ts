import { test, expect } from "@playwright/test";
import { TEST_PASSWORD } from "@/app/api/_data/auth";

// 로그인 자체를 검증하는 스펙이라 storageState 를 쓰지 않는다(@playwright/test 의 기본 test).
// 이미 로그인된 상태를 주입받으면 "미로그인 → 로그인 → 복원"·"자격 증명 실패"를 만들 수 없다.
test.describe("인증 — 로그인 복원 & 실패", () => {
  const BASE_URL = "http://localhost:3000";
  const ACCOUNT_EMAIL = "looper1@loopers.dev";
  const CREDENTIALS_ERROR = "이메일 또는 비밀번호를 확인해주세요.";

  test("미로그인으로 보호 경로에 가면 로그인 후 원래 경로로 복원되고 세션은 httpOnly 쿠키다", async ({
    page,
    context,
  }) => {
    // 보호 경로 직접 진입 → proxy 가 로그인으로 돌려보내며 원래 경로를 redirectUrl 로 보존한다.
    await page.goto("/orders/new");
    await expect(page).toHaveURL(/\/login\?redirectUrl=%2Forders%2Fnew/);

    await page.getByLabel("이메일").fill(ACCOUNT_EMAIL);
    await page.getByLabel("비밀번호").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();

    // 원래 가려던 경로로 복원된다.
    await expect(page).toHaveURL(/\/orders\/new$/);
    await expect(page.getByRole("heading", { name: "주문서" })).toBeVisible();

    // 세션 쿠키는 httpOnly — 브라우저 컨텍스트에는 잡히되 문서 JS 로는 못 읽는다.
    const sessionCookie = (await context.cookies()).find(
      (cookie) => cookie.name === "session",
    );
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  test("잘못된 자격 증명으로 로그인하면 안내가 뜨고 로그인 화면에 머문다", async ({
    page,
    context,
  }) => {
    // scenario=invalid: 서버가 자격 증명을 항상 거부(401)하도록 만들어 실패 경로를 재현한다.
    await context.addCookies([
      { name: "scenario", value: "invalid", url: BASE_URL },
    ]);
    await page.goto("/login");

    await page.getByLabel("이메일").fill(ACCOUNT_EMAIL);
    await page.getByLabel("비밀번호").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();

    // role=alert 는 Next 의 라우트 announcer 와 겹치므로 폼이 띄운 안내 문구로 특정한다.
    await expect(page.getByText(CREDENTIALS_ERROR)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
