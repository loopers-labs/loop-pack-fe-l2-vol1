import { expect, test } from "@playwright/test";

test("필터 두 개를 설정하고 새로고침하면 URL·선택값·목록이 그대로 유지된다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  const initialTotal = await page.getByText(/총 \d+개/).textContent();

  await page.getByLabel("카테고리").selectOption("casual");
  await page.getByLabel("정렬").selectOption("price-desc");
  await expect(page).toHaveURL(/category=casual/);
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.getByText(/총 \d+개/)).not.toHaveText(initialTotal ?? "");
  const filteredTotal = await page.getByText(/총 \d+개/).textContent();
  const firstProduct = await page.getByRole("heading", { level: 2 }).first().textContent();

  await page.reload();

  await expect(page).toHaveURL(/category=casual/);
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.getByLabel("카테고리")).toHaveValue("casual");
  await expect(page.getByLabel("정렬")).toHaveValue("price-desc");
  await expect(page.getByText(/총 \d+개/)).toHaveText(filteredTotal ?? "");
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(firstProduct ?? "");
});

test("기본값 조건은 새로고침 후에도 URL에 생기지 않는다", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();

  await page.getByLabel("카테고리").selectOption("casual");
  await expect(page).toHaveURL(/category=casual/);

  await page.reload();

  await expect(page).toHaveURL(/category=casual/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(page).not.toHaveURL(/sort=/);
  await expect(page).not.toHaveURL(/pageSize=/);
  await expect(page.getByLabel("정렬")).toHaveValue("latest");
});
