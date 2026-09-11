# 9주차 E2E 에이전트 생성 테스트 후보

아래 코드는 Advanced B에서 generator 역할로 생성한 테스트 후보이다. 실제 E2E suite에는 넣지 않고, 직접 작성한 `e2e/auth.spec.ts`, `e2e/checkout.spec.ts`와 비교하기 위한 산출물로 보관한다.

```ts
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Browser, TestInfo } from "@playwright/test";
import { authAccount, authStateCount, authStatePath } from "../../e2e/authState";

const appPort = process.env.PORT ?? "3000";
const appBaseURL = `http://127.0.0.1:${appPort}`;
const scenarioCookieName = "scenario";

const appURL = (pathname: string) => `${appBaseURL}${pathname}`;

const storageStateForTest = (testInfo: TestInfo) =>
  authStatePath((testInfo.parallelIndex + testInfo.repeatEachIndex) % authStateCount);

async function loginByApi(request: APIRequestContext, accountIndex = 0) {
  const response = await request.post(appURL("/api/auth/login"), {
    data: authAccount(accountIndex),
  });

  expect(response.ok()).toBe(true);
}

async function newStoredLoginPage(browser: Browser, testInfo: TestInfo) {
  const context = await browser.newContext({
    storageState: storageStateForTest(testInfo),
  });
  const page = await context.newPage();

  return { context, page };
}

test.describe("9주차 인증 E2E 후보", () => {
  test("세션 쿠키가 있으면 JavaScript 실행 전에도 주문서 Header에 사용자 이름을 보여준다", async ({
    browser,
  }) => {
    // Step 1. JavaScript가 꺼진 브라우저 컨텍스트를 만든다.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      // Step 2. API 로그인으로 세션 쿠키를 만든다.
      await loginByApi(context.request);

      // Step 3. 주문서 보호 경로에 진입한다.
      await page.goto(appURL("/order"));

      // Step 4. 초기 HTML에 로그인 사용자가 반영됐는지 확인한다.
      await expect(page.getByText("루퍼1님")).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("미로그인으로 보호 경로에 진입하면 로그인 후 원래 경로로 복원된다", async ({ page }) => {
    // Step 1. 미로그인 상태로 주문서 보호 경로에 진입한다.
    await page.goto("/order");

    // Step 2. 로그인 페이지로 이동하면서 원래 경로가 redirectTo에 실렸는지 확인한다.
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Forder$/);

    // Step 3. 올바른 자격 증명을 입력한다.
    await page.getByLabel("이메일").fill("looper1@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");

    // Step 4. 로그인한다.
    await page.getByRole("button", { name: "로그인" }).click();

    // Step 5. 로그인 후 원래 보호 경로로 복원됐는지 확인한다.
    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByRole("heading", { name: "주문서" })).toBeVisible();
  });

  test("잘못된 비밀번호로 로그인하면 로그인 페이지에 머물며 실패 메시지를 보여준다", async ({
    page,
  }) => {
    // Step 1. 로그인 페이지에 진입한다.
    await page.goto("/login");

    // Step 2. 올바른 이메일과 틀린 비밀번호를 입력한다.
    await page.getByLabel("이메일").fill("looper1@loopers.dev");
    await page.getByLabel("비밀번호").fill("wrong-password");

    // Step 3. 로그인을 시도한다.
    await page.getByRole("button", { name: "로그인" }).click();

    // Step 4. 실패 메시지가 보이고 로그인 페이지에 머무는지 확인한다.
    await expect(page.getByText("이메일 또는 비밀번호를 확인해주세요.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("expired 시나리오로 주문 내역에 진입하면 현재 화면을 유지하고 로그인 안내 모달을 보여준다", async ({
    context,
    page,
  }) => {
    // Step 1. API 로그인으로 세션 쿠키를 만든다.
    await loginByApi(context.request);

    // Step 2. 세션 만료 시나리오 쿠키를 추가한다.
    await context.addCookies([
      {
        name: scenarioCookieName,
        value: "expired",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    // Step 3. 주문 내역 보호 경로에 진입한다.
    await page.goto("/orders");

    // Step 4. 현재 화면을 유지하면서 세션 만료 안내가 보이는지 확인한다.
    await expect(page).toHaveURL(/\/orders$/);
    const dialog = page.getByRole("dialog", { name: "세션 만료" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("세션이 만료되었습니다. 다시 로그인해주세요.")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Forders",
    );
  });
});

test.describe("9주차 체크아웃 E2E 후보", () => {
  test("로그인한 사용자가 장바구니에서 주문을 완료하면 주문 내역에서 확인할 수 있다", async ({
    browser,
  }, testInfo) => {
    // Step 1. storageState로 로그인된 브라우저 컨텍스트를 만든다.
    const { context, page } = await newStoredLoginPage(browser, testInfo);

    try {
      // Step 2. 상품 목록에 진입한다.
      await page.goto(appURL("/products"));

      // Step 3. 상품 목록이 준비됐는지 확인한다.
      const firstCartButton = page.getByRole("button", {
        name: "1번 상품 장바구니",
        exact: true,
      });
      await expect(firstCartButton).toBeVisible();
      await expect(page.getByLabel("장바구니 0")).toBeVisible();

      // Step 4. 첫 번째 상품을 장바구니에 담는다.
      await firstCartButton.click();

      // Step 5. Header 장바구니 링크로 장바구니에 이동한다.
      await expect(page.getByLabel("장바구니 1")).toBeVisible();
      await page.getByLabel("장바구니 1").click();
      await expect(page).toHaveURL(/\/cart$/);

      // Step 6. 주문 대상 상품이 선택되어 있는지 확인한다.
      const selectedProduct = page.getByRole("checkbox").first();
      await expect(selectedProduct).toBeChecked();
      const selectedProductLabel = await selectedProduct.getAttribute("aria-label");
      const selectedProductId = selectedProductLabel?.replace(" 주문 선택", "");

      if (selectedProductId === undefined) {
        throw new Error("주문할 상품 id를 확인하지 못했습니다.");
      }

      // Step 7. 주문서로 이동한다.
      await page.getByRole("link", { name: "주문하기" }).click();

      // Step 8. 주문서에서 선택 상품과 수량을 확인한다.
      await expect(page).toHaveURL(/\/order$/);
      await expect(page.getByLabel(`${selectedProductId} 수량 1`)).toBeVisible();

      // Step 9. 주문을 완료한다.
      await page.getByRole("button", { name: "주문 완료" }).click();

      // Step 10. 주문 내역에서 주문 결과를 확인한다.
      await expect(page).toHaveURL(/\/orders$/);
      await expect(page.getByRole("article", { name: /주문 o\d+/ })).toContainText(
        `${selectedProductId} 1개`,
      );
    } finally {
      await context.close();
    }
  });
});
```
