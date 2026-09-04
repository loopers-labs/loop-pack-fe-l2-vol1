// spec: specs/auth-flow.plan.md
// seed: e2e/seed.spec.ts

import { expect, type Page, test } from "@playwright/test";

const ACCOUNT = "looper1@loopers.dev";
const PASSWORD = "looper1234";
const WRONG_PASSWORD = "wrongpassword";
const INVALID_CREDENTIALS_MESSAGE = "이메일 또는 비밀번호를 확인해주세요.";

async function submitLogin(page: Page, email: string, password: string) {
  await page.getByRole("textbox", { name: "이메일" }).fill(email);
  await page.getByRole("textbox", { name: "비밀번호" }).fill(password);
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "로그인" }).click();
  return loginResponsePromise;
}

test.describe("잘못된 자격증명", () => {
  test("잘못된 비밀번호로 로그인하면 에러 메시지가 보이고 페이지 이동이 일어나지 않는다", async ({
    page,
  }) => {
    // 1. 미로그인 상태에서 /login 에 접근해 이메일에 looper1@loopers.dev, 비밀번호에 wrongpassword 를 입력하고 '로그인' 버튼을 클릭한다
    await page.goto("/login");
    const loginResponse = await submitLogin(page, ACCOUNT, WRONG_PASSWORD);
    expect(loginResponse.status()).toBe(401);
    await expect(page).toHaveURL("/login");
    await expect(page.locator("main").getByRole("alert")).toHaveText(INVALID_CREDENTIALS_MESSAGE);
    await expect(page.getByRole("textbox", { name: "이메일" })).toHaveValue(ACCOUNT);
    await expect(page.getByRole("textbox", { name: "비밀번호" })).toHaveValue(WRONG_PASSWORD);
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그아웃" })).not.toBeVisible();
  });

  test("존재하지 않는 이메일로 로그인하면 동일한 일반 에러 메시지가 보인다(계정 존재 여부를 노출하지 않는다)", async ({
    page,
  }) => {
    // 1. 이메일에 nobody@loopers.dev, 비밀번호에 looper1234 를 입력하고 로그인한다
    await page.goto("/login");
    const loginResponse = await submitLogin(page, "nobody@loopers.dev", PASSWORD);
    expect(loginResponse.status()).toBe(401);
    await expect(page.locator("main").getByRole("alert")).toHaveText(INVALID_CREDENTIALS_MESSAGE);
    await expect(page).toHaveURL("/login");
  });

  test("에러가 보인 상태에서 값을 고쳐 재시도하면 정상 로그인된다", async ({ page }) => {
    // 1. 잘못된 비밀번호로 한 번 실패한 직후, 비밀번호 입력란을 looper1234로 고치고 다시 '로그인' 버튼을 클릭한다
    await page.goto("/login");
    await submitLogin(page, ACCOUNT, WRONG_PASSWORD);
    await expect(page.locator("main").getByRole("alert")).toBeVisible();

    await page.getByRole("textbox", { name: "비밀번호" }).fill(PASSWORD);
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/login") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "로그인" }).click();
    await loginResponsePromise;

    await expect(page).toHaveURL("/");
    await expect(page.locator("main").getByRole("alert")).not.toBeVisible();
  });

  test("로그인 요청이 진행 중일 때 버튼이 중복 제출을 막는다", async ({ page }) => {
    // 1. 올바른 자격증명을 입력하고 '로그인' 버튼을 클릭한 직후(응답이 오기 전) 버튼 상태를 확인한다
    await page.route("**/api/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });
    await page.goto("/login");
    await page.getByRole("textbox", { name: "이메일" }).fill(ACCOUNT);
    await page.getByRole("textbox", { name: "비밀번호" }).fill(PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();

    const submittingButton = page.getByRole("button", { name: "로그인 중" });
    await expect(submittingButton).toBeVisible();
    await expect(submittingButton).toBeDisabled();
  });

  test("이메일·비밀번호를 비운 채 제출하면 API 호출 없이 브라우저 자체 검증에 막힌다", async ({
    page,
  }) => {
    // 1. 이메일·비밀번호 입력란을 비운 채 '로그인' 버튼을 클릭한다
    await page.goto("/login");
    const loginRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/auth/login") && request.method() === "POST") {
        loginRequests.push(request.url());
      }
    });

    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByRole("textbox", { name: "이메일" })).toBeFocused();
    expect(loginRequests).toHaveLength(0);
    await expect(page).toHaveURL("/login");
  });
});
