import { expect, test } from "@playwright/test";

test("목록에서 상품을 찜하면 헤더가 1이 되고 다시 누르면 0으로 돌아간다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  await expect(page.getByText("위시리스트 0")).toBeVisible();

  const firstWishlistButton = page.getByRole("button", { name: /위시리스트$/ }).first();
  await firstWishlistButton.click();
  await expect(page.getByText("위시리스트 1")).toBeVisible();
  await expect(firstWishlistButton).toHaveText("찜됨");

  await firstWishlistButton.click();
  await expect(page.getByText("위시리스트 0")).toBeVisible();
  await expect(firstWishlistButton).toHaveText("찜");
});

test("찜한 상태로 새로고침하면 위시리스트가 0으로 돌아간다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  await page
    .getByRole("button", { name: /위시리스트$/ })
    .first()
    .click();
  await expect(page.getByText("위시리스트 1")).toBeVisible();

  await page.reload();

  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  await expect(page.getByText("위시리스트 0")).toBeVisible();
});
