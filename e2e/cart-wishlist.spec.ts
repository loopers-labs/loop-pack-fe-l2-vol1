// [AI] 장바구니·위시리스트 E2E 검증 (week08-test-plan.md items 12 보완·15).
// 통합(ProductList.interactions)이 담당하는 토글→헤더 wiring과는 층을 나눠,
// E2E는 실제 브라우저에서만 재현되는 플랫폼 경로만 검증한다.
import { test, expect } from '@playwright/test';

const expectCartCount = (page: import('@playwright/test').Page, n: number) =>
  expect(page.getByText(/장바구니 \d+/)).toHaveText(`장바구니 ${n}`);

// [AI] item 15 — 전체 여정 smoke. "진입 → 담기 → 헤더"가 production build에서
// 이어지는지만 잡는다(조립 누락·hydration 결함·런타임 에러 계층).
test.describe('item 15 — 전체 여정: 목록 진입 → 담기 → 헤더 확인', () => {
  test('풀 로드 진입 후 담으면 헤더 장바구니 개수가 오른다', async ({ page }) => {
    await page.goto('/products');

    const cartBtn = page
      .locator('article.product')
      .first()
      .getByRole('button', { name: /장바구니/ });

    // 진입 확인: 풀 로드 + hydration 직후 실제 DOM에 버튼이 있다
    await expect(cartBtn).toBeVisible();
    await expectCartCount(page, 0);

    await cartBtn.click();

    await expectCartCount(page, 1);
  });
});
