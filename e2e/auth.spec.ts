import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { authAccount } from "./authState";

const appPort = process.env.PORT ?? "3000";
const appBaseURL = `http://127.0.0.1:${appPort}`;
const scenarioCookieName = "scenario";
const initialHtmlSessionRoutes = [
  { pathname: "/order", label: "주문서" },
  { pathname: "/orders", label: "주문 내역" },
] as const;

async function login(contextRequest: APIRequestContext) {
  const response = await contextRequest.post(`${appBaseURL}/api/auth/login`, {
    data: authAccount(0),
  });

  expect(response.ok()).toBe(true);
}

test.describe("인증 초기 HTML", () => {
  for (const { pathname, label } of initialHtmlSessionRoutes) {
    test(`세션 쿠키가 있으면 JavaScript 실행 전에도 ${label} Header에 사용자 이름을 보여준다`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await login(context.request);
      await page.goto(`${appBaseURL}${pathname}`);

      await expect(page.getByText("루퍼1님")).toBeVisible();

      await context.close();
    });
  }
});

test.describe("로그인 보호 경로", () => {
  test("미로그인으로 주문서에 진입하면 로그인 후 원래 주문서 경로로 복원된다", async ({ page }) => {
    await page.goto("/order");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Forder$/);
    await page.getByLabel("이메일").fill("looper1@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByRole("heading", { name: "주문서" })).toBeVisible();
  });
});

test.describe("로그인 실패", () => {
  test("잘못된 비밀번호로 로그인하면 로그인 페이지에 머물며 실패 메시지를 보여준다", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill("looper1@loopers.dev");
    await page.getByLabel("비밀번호").fill("wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();

    await expect(page.getByText("이메일 또는 비밀번호를 확인해주세요.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("세션 만료 안내", () => {
  test("expired 시나리오로 주문 내역에 진입하면 현재 화면을 유지하고 로그인 안내 모달을 보여준다", async ({
    context,
    page,
  }) => {
    await login(context.request);
    await context.addCookies([
      {
        name: scenarioCookieName,
        value: "expired",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    await page.goto("/orders");

    await expect(page).toHaveURL(/\/orders$/);
    const authRequiredDialog = page.getByRole("dialog", { name: "세션 만료" });
    await expect(authRequiredDialog).toBeVisible();
    await expect(
      authRequiredDialog.getByText("세션이 만료되었습니다. 다시 로그인해주세요."),
    ).toBeVisible();
    await expect(authRequiredDialog.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Forders",
    );
  });

  test("주문 생성 API가 401을 응답하면 주문서 화면을 유지하고 로그인 안내 모달을 보여준다", async ({
    context,
    page,
  }) => {
    await login(context.request);
    await page.addInitScript(() => {
      localStorage.setItem(
        "anonymous-cart-store",
        JSON.stringify({
          state: {
            cartProductQuantityMap: { p1: 1 },
            selectedCartProductIdMap: { p1: true },
          },
          version: 1,
        }),
      );
    });

    await page.goto("/order");
    await expect(page.getByRole("button", { name: "주문 완료" })).toBeVisible();
    await page.route("**/api/orders", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "로그인이 필요합니다." }),
      }),
    );

    await page.getByRole("button", { name: "주문 완료" }).click();

    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByRole("dialog", { name: "세션 만료" })).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Forder",
    );
  });
});
