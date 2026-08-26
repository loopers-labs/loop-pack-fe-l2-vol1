import { test, expect } from '@playwright/test';

// 정상: 1) 뒤로가기를 누르면 이전 카테고리 필터로 복원됨
// 경계: 2) 뒤로갔다가 다시 앞으로가면 나중 상태로 복원됨
//       3) 카테고리를 3번 바꾼 뒤 뒤로가기 2번 하면 첫 번째 상태로 정확히 복원됨
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

test('뒤로갔다가 다시 앞으로가면 나중 상태로 복원된다', async ({ page }) => {
  await page.goto('/products');

  const categorySelect = page.getByLabel('카테고리');

  await categorySelect.selectOption({ label: '캐주얼' });
  await expect(page).toHaveURL(/category=casual/);

  await categorySelect.selectOption({ label: '패션' });
  await expect(page).toHaveURL(/category=fashion/);

  await page.goBack();
  await expect(page).toHaveURL(/category=casual/);

  await page.goForward();
  await expect(page).toHaveURL(/category=fashion/);
  await expect(categorySelect).toHaveValue('fashion');
});

test('카테고리를 3번 바꾼 뒤 뒤로가기 2번 하면 첫 번째 상태로 복원된다', async ({
  page,
}) => {
  await page.goto('/products');

  const categorySelect = page.getByLabel('카테고리');

  await categorySelect.selectOption({ label: '캐주얼' });
  await expect(page).toHaveURL(/category=casual/);

  await categorySelect.selectOption({ label: '패션' });
  await expect(page).toHaveURL(/category=fashion/);

  await categorySelect.selectOption({ label: '홈' });
  await expect(page).toHaveURL(/category=home/);

  await page.goBack();
  await expect(page).toHaveURL(/category=fashion/);

  await page.goBack();
  await expect(page).toHaveURL(/category=casual/);
  await expect(categorySelect).toHaveValue('casual');
});
