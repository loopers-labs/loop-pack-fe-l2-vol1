import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

const appPort = process.env.PORT ?? "3000";
const appBaseURL = `http://127.0.0.1:${appPort}`;

async function login(contextRequest: APIRequestContext) {
  const response = await contextRequest.post(`${appBaseURL}/api/auth/login`, {
    data: {
      email: "looper1@loopers.dev",
      password: "looper1234",
    },
  });

  expect(response.ok()).toBe(true);
}

test.describe("인증 초기 HTML", () => {
  test("세션 쿠키가 있으면 JavaScript 실행 전에도 주문서 Header에 사용자 이름을 보여준다", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await login(context.request);
    await page.goto(`${appBaseURL}/order`);

    await expect(page.getByText("루퍼1님")).toBeVisible();

    await context.close();
  });

  test("세션 쿠키가 있으면 JavaScript 실행 전에도 주문 내역 Header에 사용자 이름을 보여준다", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await login(context.request);
    await page.goto(`${appBaseURL}/orders`);

    await expect(page.getByText("루퍼1님")).toBeVisible();

    await context.close();
  });
});
