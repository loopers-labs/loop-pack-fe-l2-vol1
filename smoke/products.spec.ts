import { expect, test } from '@playwright/test';

// 06-smoke-test-plan.md 4번 — 목록 라우팅과 데이터 존재를 함께 본다.
test('상품 목록이 렌더되고 항목이 있다', async ({ page }) => {
  await page.goto('/products');

  const results = page.getByRole('region', { name: '상품 검색 결과' });
  await expect(results).toHaveAttribute('aria-busy', 'false');
  await expect(results.getByRole('article').first()).toBeVisible();
});
