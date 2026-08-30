import { expect, test } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import { authStateCount, authStatePath } from "./authState";

const checkoutProductId = "p1";

const storageStateForTest = (testInfo: TestInfo) =>
  authStatePath((testInfo.parallelIndex + testInfo.repeatEachIndex) % authStateCount);

test.describe("주문 E2E", () => {
  test("로그인한 사용자가 장바구니에서 주문을 완료하면 주문 내역에서 확인할 수 있다", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: storageStateForTest(testInfo),
    });
    await context.addInitScript((productId) => {
      localStorage.setItem(
        "anonymous-cart-store",
        JSON.stringify({
          state: {
            cartProductQuantityMap: { [productId]: 1 },
            selectedCartProductIdMap: { [productId]: true },
          },
          version: 1,
        }),
      );
    }, checkoutProductId);
    const page = await context.newPage();

    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByLabel(`${checkoutProductId} 주문 선택`)).toBeChecked();

    await page.getByRole("link", { name: "주문하기" }).click();

    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByLabel(`${checkoutProductId} 수량 1`)).toBeVisible();

    await page.getByRole("button", { name: "주문 완료" }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("article", { name: /주문 o\d+/ })).toContainText(
      `${checkoutProductId} 1개`,
    );

    await context.close();
  });
});
