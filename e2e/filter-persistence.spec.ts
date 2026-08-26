import { test, expect } from '@playwright/test';

// 정상: 1) 새로고침해도 필터 상태가 유지됨
//       2) 필터가 담긴 URL로 직접 접속하면 그 상태로 화면이 렌더됨
// 경계: 3) 카테고리+정렬 여러 필터가 동시에 걸린 상태로 새로고침해도 전부 유지됨
//       4) 잘못된 값이 담긴 URL로 재진입해도 앱이 깨지지 않고 기본값으로 처리됨
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

test('여러 필터가 동시에 걸린 상태로 새로고침해도 전부 유지된다', async ({
  page,
}) => {
  await page.goto('/products');

  await page.getByLabel('카테고리').selectOption({ label: '패션' });
  await page.getByLabel('정렬').selectOption({ label: '낮은 가격순' });
  await expect(page).toHaveURL(/category=fashion/);
  await expect(page).toHaveURL(/sort=price-asc/);

  await page.reload();

  await expect(page.getByLabel('카테고리')).toHaveValue('fashion');
  await expect(page.getByLabel('정렬')).toHaveValue('price-asc');
});

test('잘못된 값이 담긴 URL로 재진입해도 앱이 깨지지 않고 기본값으로 처리된다', async ({
  page,
}) => {
  await page.goto('/products?category=존재하지않는카테고리');

  // 페이지가 정상적으로 로드되고, 카테고리는 기본값(전체)으로 처리되어야 함
  await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible();
  await expect(page.getByLabel('카테고리')).toHaveValue('all');
});
