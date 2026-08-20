import { test, expect } from '@playwright/test';

test('새로고침해도 필터 상태가 유지된다', async ({ page }) => {
  await page.goto('/products');

  const categorySelect = page.getByLabel('카테고리');
  await categorySelect.selectOption({ label: '홈' });
  await expect(page).toHaveURL(/category=home/);

  await page.reload();

  await expect(page).toHaveURL(/category=home/);
  await expect(categorySelect).toHaveValue('home');
});

test('필터가 담긴 URL로 직접 접속하면 그 상태로 화면이 렌더된다', async ({
  page,
}) => {
  await page.goto('/products?category=digital&sort=price-desc');

  await expect(page.getByLabel('카테고리')).toHaveValue('digital');
  await expect(page.getByLabel('정렬')).toHaveValue('price-desc');
});
