import { expect, test } from "@playwright/test";

test("필터를 바꾼 뒤 뒤로 가기를 하면 직전 필터 상태로 돌아간다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  await page.getByLabel("카테고리").selectOption("casual");
  await expect(page).toHaveURL(/category=casual/);
  await page.getByLabel("정렬").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);

  await page.goBack();
  await expect(page).toHaveURL(/category=casual/);
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page.getByLabel("카테고리")).toHaveValue("casual");
  await expect(page.getByLabel("정렬")).toHaveValue("latest");
});

test("뒤로 두 번이면 최초 진입 상태까지, 앞으로 가기로 각 단계가 되살아난다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  await page.getByLabel("카테고리").selectOption("casual");
  await expect(page).toHaveURL(/category=casual/);
  await page.getByLabel("정렬").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);

  await page.goBack();
  await page.goBack();
  await expect(page).not.toHaveURL(/category=/);
  await expect(page.getByLabel("카테고리")).toHaveValue("all");
  await expect(page.getByLabel("정렬")).toHaveValue("latest");

  await page.goForward();
  await expect(page).toHaveURL(/category=casual/);
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page.getByLabel("카테고리")).toHaveValue("casual");

  await page.goForward();
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.getByLabel("정렬")).toHaveValue("price-desc");
});
