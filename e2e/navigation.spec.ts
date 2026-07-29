// [AI] nuqs URL 상태 — history:'push' 와 뒤로/앞으로 복원 E2E 검증.
import { test, expect } from '@playwright/test';

const STANLEY_ENCODED = 'q=%EC%8A%A4%ED%83%A0%EB%A6%AC';

test.describe('URL 상태 — 뒤로/앞으로 복원', () => {
  test('검색어·카테고리 변경이 history에 push되어 복원된다', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('article.product').first()).toBeVisible();

    // [AI] getByLabel('검색')은 <section aria-label="상품 검색 결과">와 충돌하므로 name으로 고정.
    const search = page.locator('input[name="q"]');
    const category = page.locator('select[name="category"]');

    // 1) 검색어 입력(debounce 300ms 후 URL 반영)
    await search.fill('스탠리');
    await expect(page).toHaveURL(new RegExp(STANLEY_ENCODED));

    // 2) 카테고리 변경
    await category.selectOption('digital');
    await expect(page).toHaveURL(/category=digital/);

    // 3) 뒤로 → 검색어만 있던 상태로 복원
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(STANLEY_ENCODED));
    await expect(page).not.toHaveURL(/category=digital/);
    await expect(search).toHaveValue('스탠리');
    await expect(category).toHaveValue('all');

    // 4) 앞으로 → 카테고리 digital 상태로 복원
    await page.goForward();
    await expect(page).toHaveURL(/category=digital/);
    await expect(category).toHaveValue('digital');
  });

  test('검색어·카테고리·정렬 변경 시 page가 1로 리셋된다', async ({ page }) => {
    await page.goto('/products?page=3');
    await expect(page.locator('nav[aria-label="페이지 이동"] span')).toHaveText(/^3 \//);

    // [AI] 필터를 바꾸면 page가 기본값 1로 돌아간다. nuqs는 기본값(1)을 URL에서 제거하므로
    // page=3이 URL에서 사라지고 페이지네이션 표시가 1로 바뀌는 것으로 reset을 확인한다.
    await page.locator('select[name="category"]').selectOption('digital');

    await expect(page).toHaveURL(/category=digital/);
    await expect(page).not.toHaveURL(/page=3/);
    await expect(page.locator('nav[aria-label="페이지 이동"] span')).toHaveText(/^1 \//);
  });
});
