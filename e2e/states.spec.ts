// [AI] 상품 목록 4종 상태(정상·로딩·에러·빈) E2E 검증.
// 페이지가 scenario를 URL로 넘기지 않으므로 page.route로 /api/products 응답을 제어한다.
import { test, expect } from '@playwright/test';

test.describe('상품 목록 — 4종 상태', () => {
  test('정상: 상품 카드와 총 개수가 노출된다', async ({ page }) => {
    await page.goto('/products');

    await expect(page.locator('article.product').first()).toBeVisible();
    await expect(page.getByText(/총 [\d,]+개/)).toBeVisible();
  });

  test('로딩: "불러오는 중..." 메시지가 표시된다', async ({ page }) => {
    // [AI] 라우트를 지연시켜 로딩 상태를 충분히 관측한다(기본 500ms 지연으로는 흐름이 빨라 불안정).
    await page.route('**/api/products**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto('/products');
    await expect(page.getByText('불러오는 중...')).toBeVisible();
  });

  test('에러: alert 메시지와 "다시 시도" 버튼이 표시된다', async ({ page }) => {
    await page.route('**/api/products**', (route) =>
      route.fulfill({
        status: 500,
        json: { message: '상품 목록을 불러오지 못했습니다.' },
      })
    );

    await page.goto('/products');

    // [AI] getByRole('alert')는 Next.js route announcer와 충돌하므로 텍스트로 좁힌다.
    await expect(page.getByText(/상품을 불러오지 못했습니다/)).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('빈 결과: "검색 결과가 없습니다." 메시지가 표시된다', async ({ page }) => {
    await page.route('**/api/products**', (route) =>
      route.fulfill({
        status: 200,
        json: {
          products: [],
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
        },
      })
    );

    await page.goto('/products');

    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});
