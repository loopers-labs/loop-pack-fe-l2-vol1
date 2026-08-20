import { test, expect } from '@playwright/test';

// 정상: 1) 목록에 진입해 담기를 누르면 헤더 개수가 반영됨
// 경계: 2) 담긴 상품을 다시 누르면(빼기) 헤더 개수가 다시 줄어듦
//       3) 서로 다른 상품 2개를 연달아 담으면 헤더 개수가 2로 반영됨
test('목록에 진입해 담기를 누르면 헤더 개수가 반영된다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: '상품' }).click();
  await expect(page).toHaveURL(/\/products/);

  await expect(page.getByText('장바구니 0')).toBeVisible();

  const firstCartButton = page
    .getByRole('button', { name: /장바구니$/ })
    .first();
  await firstCartButton.click();

  await expect(page.getByText('장바구니 1')).toBeVisible();
});

test('담긴 상품을 다시 누르면 헤더 개수가 다시 줄어든다', async ({ page }) => {
  await page.goto('/products');

  const firstCartButton = page
    .getByRole('button', { name: /장바구니$/ })
    .first();

  await firstCartButton.click();
  await expect(page.getByText('장바구니 1')).toBeVisible();

  await firstCartButton.click();
  await expect(page.getByText('장바구니 0')).toBeVisible();
});

test('서로 다른 상품 2개를 연달아 담으면 헤더 개수가 2로 반영된다', async ({
  page,
}) => {
  await page.goto('/products');

  const cartButtons = page.getByRole('button', { name: /장바구니$/ });

  await cartButtons.nth(0).click();
  await expect(page.getByText('장바구니 1')).toBeVisible();

  await cartButtons.nth(1).click();
  await expect(page.getByText('장바구니 2')).toBeVisible();
});
