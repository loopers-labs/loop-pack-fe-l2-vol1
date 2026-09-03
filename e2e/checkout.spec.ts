import { expect, test } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import { authStateCount, authStatePath } from "./authState";

const storageStateForTest = (testInfo: TestInfo) =>
  authStatePath((testInfo.parallelIndex + testInfo.repeatEachIndex) % authStateCount);

test.describe("주문 E2E", () => {
  test("로그인한 사용자가 장바구니에서 주문을 완료하면 주문 내역에서 확인할 수 있다", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: storageStateForTest(testInfo),
    });
    const page = await context.newPage();

    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).toBeVisible();
    await expect(page.getByLabel("장바구니 0")).toBeVisible();

    await page.getByRole("button", { name: "1번 상품 장바구니", exact: true }).click();
    await expect(page.getByLabel("장바구니 1")).toBeVisible();

    await page.getByLabel("장바구니 1").click();
    await expect(page).toHaveURL(/\/cart$/);

    const selectedProduct = page.getByRole("checkbox").first();
    await expect(selectedProduct).toBeChecked();
    const selectedProductLabel = await selectedProduct.getAttribute("aria-label");
    const selectedProductId = selectedProductLabel?.replace(" 주문 선택", "");

    if (selectedProductId === undefined) {
      throw new Error("주문할 상품 id를 확인하지 못했습니다.");
    }

    await page.getByRole("link", { name: "주문하기" }).click();

    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByLabel(`${selectedProductId} 수량 1`)).toBeVisible();

    await page.getByRole("button", { name: "주문 완료" }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("article", { name: /주문 o\d+/ })).toContainText(
      `${selectedProductId} 1개`,
    );

    await context.close();
  });
});
