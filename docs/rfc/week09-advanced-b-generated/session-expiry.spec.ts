// spec: specs/auth-flow.plan.md
// seed: e2e/seed.spec.ts

import { expect, type Page, test } from "@playwright/test";

const ACCOUNT = "looper1@loopers.dev";
const PASSWORD = "looper1234";

async function login(page: Page) {
  await page.getByRole("textbox", { name: "이메일" }).fill(ACCOUNT);
  await page.getByRole("textbox", { name: "비밀번호" }).fill(PASSWORD);
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "로그인" }).click();
  return loginResponsePromise;
}

test.describe("세션 만료", () => {
  test("보호 자원 조회 중 세션이 만료되면(scenario=expired) 로그인으로 유도되고, 재로그인하면 원래 경로로 복원된다", async ({
    page,
    context,
  }) => {
    // 1. looper1@loopers.dev / looper1234 로 정상 로그인해 /orders 에 진입한 상태를 만든다
    await page.goto("/login");
    await login(page);
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "주문 내역" })).toBeVisible();
    await expect(page.getByText("루퍼1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === "session");
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);

    // 2. 쿠키 scenario=expired 를 추가한다(mock 백엔드가 실제 session 쿠키 유효성과 무관하게
    //    보호 API를 401 '로그인이 필요합니다.'로 응답하게 만드는 테스트 훅). 이후 /orders 를 다시 방문(새로고침)한다
    await context.addCookies([
      { name: "scenario", value: "expired", domain: "localhost", path: "/" },
    ]);
    const ordersResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/orders") && response.request().method() === "GET",
    );
    await page.reload();
    const ordersResponse = await ordersResponsePromise;
    expect(ordersResponse.status()).toBe(401);
    await expect(page).toHaveURL("/login?redirect=%2Forders");
    await expect(page.getByRole("textbox", { name: "이메일" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "비밀번호" })).toBeVisible();

    // 3. scenario 쿠키를 제거해 실제 재로그인이 성공하도록 만든 뒤, 이메일/비밀번호를 다시 입력하고 로그인한다
    await context.clearCookies({ name: "scenario" });
    const loginResponse = await login(page);
    expect(loginResponse.status()).toBe(200);
    await expect(page).toHaveURL("/orders");
    await expect(page.getByRole("heading", { name: "주문 내역" })).toBeVisible();
  });

  test("로그인 페이지에서 발생한 401은 리다이렉트 루프를 만들지 않는다", async ({ page, context }) => {
    // 1. 쿠키 scenario=invalid 를 설정한 상태에서 /login 으로 이동해
    //    looper1@loopers.dev / looper1234 로 로그인을 시도한다(로그인 API 자체가 401을 반환하는 상황)
    await context.addCookies([
      { name: "scenario", value: "invalid", domain: "localhost", path: "/" },
    ]);
    await page.goto("/login");
    const loginResponse = await login(page);
    expect(loginResponse.status()).toBe(401);
    await expect(page).toHaveURL("/login");
    await expect(page.locator("main").getByRole("alert")).toHaveText(
      "이메일 또는 비밀번호를 확인해주세요.",
    );
  });
});
