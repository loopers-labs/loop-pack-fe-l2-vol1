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

test.describe("인증 플로우", () => {
  test("미로그인 상태에서 보호 경로 진입 시 로그인으로 리다이렉트되고, 로그인 후 원래 경로로 복원된다", async ({
    page,
  }) => {
    // 1. 브라우저 쿠키를 비운 새 컨텍스트(미로그인 상태)에서 /orders 로 직접 접근한다
    await page.goto("/orders");
    await expect(page).toHaveURL("/login?redirect=%2Forders");
    await expect(page.getByRole("textbox", { name: "이메일" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "비밀번호" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).not.toBeVisible();

    // 2. 이메일 입력란에 looper1@loopers.dev, 비밀번호 입력란에 looper1234를 입력하고 '로그인' 버튼을 클릭한다
    const loginResponse = await login(page);
    expect(loginResponse.status()).toBe(200);
    await expect(page).toHaveURL("/orders");
    await expect(page.getByText("루퍼1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await expect(page.getByRole("link", { name: "주문 내역" })).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "주문 내역" })).toBeVisible();
  });

  test("redirect 파라미터 없이 /login에 직접 진입해 로그인하면 홈으로 이동한다", async ({ page }) => {
    // 1. 미로그인 상태에서 /login 으로 직접 접근한다(redirect 쿼리 없음)
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: "이메일" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "비밀번호" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();

    // 2. looper1@loopers.dev / looper1234 로 로그인한다
    await login(page);
    await expect(page).toHaveURL("/");
    await expect(page.getByText("루퍼1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  });

  test("redirect 파라미터가 외부 URL이면 오픈 리다이렉트를 막고 홈으로 대체한다", async ({ page }) => {
    // 1. 미로그인 상태에서 /login?redirect=https%3A%2F%2Fevil.com 으로 접근한다
    await page.goto("/login?redirect=https%3A%2F%2Fevil.com");
    await expect(page.getByRole("textbox", { name: "이메일" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "비밀번호" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();

    // 2. looper1@loopers.dev / looper1234 로 로그인한다
    await login(page);
    await expect(page).toHaveURL("/");
  });

  test("장바구니·상품 등 공개 경로는 미로그인 상태에서도 리다이렉트 없이 접근된다", async ({ page }) => {
    // 1. 미로그인 상태에서 /products, /cart 에 각각 접근한다
    await page.goto("/products");
    await expect(page).toHaveURL("/products");

    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await expect(page.getByRole("heading", { name: "장바구니" })).toBeVisible();
  });
});
