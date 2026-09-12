import { expect, test } from '@playwright/test';

// 06-smoke-test-plan.md 3·4번 — 판정 수준은 "데이터 존재"까지다. HTTP 200이나 요소 렌더만으로는
// getAppOrigin() 오류로 인한 apiFetch 실패(서버 렌더 데이터 없음)를 놓친다.
test('홈이 렌더되고 추천 상품 데이터가 있다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '이번 주 추천 상품' })).toBeVisible();

  // 상품명·개수는 단언하지 않는다 — 데이터가 바뀔 때마다 깨지는 것을 피하고, "존재 여부"만 본다.
  await expect(page.getByRole('article').first()).toBeVisible();
});
