import { expect, type Page, test } from "@playwright/test";

// 로그인 자체(폼 제출·복원·자격 오류)를 검증하므로 storageState를 쓰지 않는다.
// 이미 로그인된 상태로 시작하면 로그인 폼도, 미로그인→복원 흐름도 볼 수 없기 때문이다.
// 그래서 이 파일은 워커 인증 fixture가 아니라 기본 test(빈 컨텍스트)를 쓴다.
// (세션 만료는 "이미 로그인된 세션의 만료"라 로그인 검증이 아니므로 session-expiry.spec.ts에서 storageState로 다룬다.)

// 계정을 워커별로 가르지 않고 looper1을 직접 쓴다. order.spec의 워커0도 looper1을 쓰지만,
// 이 파일은 주문을 만들지 않아 서버 상태가 안 쌓이고 복원 테스트도 주문 내용을 단언하지 않아,
// 계정을 공유해도 충돌하지 않는다. 여기에 주문 생성·내역 검증을 더하면 그때 격리가 필요해진다.
const ACCOUNT = "looper1@loopers.dev";
const PASSWORD = "looper1234";

async function fillLogin(page: Page) {
  await page.getByLabel("이메일").fill(ACCOUNT);
  await page.getByLabel("비밀번호").fill(PASSWORD);
  // 헤더에도 "로그인" 링크가 있으나 role이 link라, 폼 제출 버튼(button)만 집힌다.
  await page.getByRole("button", { name: "로그인" }).click();
}

test.describe("인증 플로우", () => {
  test("미로그인으로 보호 경로에 들어가면 로그인 후 원래 경로로 복원된다", async ({ page }) => {
    await page.goto("/orders");
    // proxy가 로그인으로 돌리고 원래 경로를 redirect로 싣는다(복원의 기준값).
    await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

    await fillLogin(page);

    // 복원은 앱이 스스로 한다(LoginForm onSuccess의 router.replace(safeRedirect)) — 수동 goto 없이 URL이 돌아온다.
    await expect(page).toHaveURL(/\/orders/);
    // 게이트가 실제로 열렸다: 로그인 상태가 헤더에 반영되고, 로그인 폼으로 다시 튕기지 않았다.
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await expect(page.getByLabel("비밀번호")).toHaveCount(0);
  });

  test("자격 증명이 틀리면 에러를 보이고 이동하지 않는다", async ({ page, context }) => {
    // invalid 시나리오면 자격이 맞아도 항상 401이라, 틀린 비밀번호 없이 실패 경로를 결정적으로 재현한다.
    await context.addCookies([
      { name: "scenario", value: "invalid", url: "http://localhost:3000" },
    ]);

    await page.goto("/login");
    await fillLogin(page);

    // alert은 main 안으로 좁힌다(Next 라우트 어나운서가 body 직속의 role=alert라, 앱 에러 alert만 남긴다).
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    // 실패했으니 로그인 화면에 그대로 머문다.
    await expect(page).toHaveURL(/\/login/);
  });
});
