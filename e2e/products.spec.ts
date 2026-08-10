import { expect, test } from "@playwright/test";

test("상품 목록 페이지는 production 라우트에서 상품 목록과 필터를 보여준다", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "상품 목록", level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "검색" })).toBeVisible();
  await expect(page.getByRole("button", { name: "카테고리" })).toBeVisible();
  await expect(page.getByRole("button", { name: "정렬" })).toBeVisible();
  await expect(page.getByLabel("상품 목록")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});
