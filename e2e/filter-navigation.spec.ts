import { test, expect } from '@playwright/test';

test('뒤로가기를 누르면 이전 카테고리 필터로 복원된다', async ({ page }) => {
  await page.goto('/products');

  const categorySelect = page.getByLabel('카테고리');

  // 첫 번째 카테고리 선택
  await categorySelect.selectOption({ label: '캐주얼' });
  await expect(page).toHaveURL(/category=casual/);

  // 두 번째 카테고리로 변경
  await categorySelect.selectOption({ label: '패션' });
  await expect(page).toHaveURL(/category=fashion/);

  // 뒤로가기 → 첫 번째 카테고리 상태로 복원되어야 함
  await page.goBack();
  await expect(page).toHaveURL(/category=casual/);
  await expect(categorySelect).toHaveValue('casual');
});
