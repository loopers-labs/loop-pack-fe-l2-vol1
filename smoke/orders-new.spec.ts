import { expect, test } from '@playwright/test';

// 06-smoke-test-plan.md 4번 — 미들웨어·인증 경로를 확인한다. 로그인 수행 자체는
// e2e/auth.spec.ts가 검증하므로 여기서는 리다이렉트 도달까지만 본다.
// 이 config는 storageState를 지정하지 않아 매 테스트가 미로그인 상태로 시작한다.
test('미로그인으로 주문서에 접근하면 로그인 화면으로 안내된다', async ({ page }) => {
  await page.goto('/orders/new');

  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
});
