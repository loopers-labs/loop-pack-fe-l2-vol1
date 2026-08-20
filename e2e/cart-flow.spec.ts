import { expect, test } from '@playwright/test';

/**
 * 검증 항목 15 — 목록 진입 → 담기 → 헤더 확인
 *
 * 이 항목만 `persist` 의 localStorage 왕복과 Next hydration 을 한 번에 지난다.
 * 통합(jsdom)에서는 store 를 직접 초기화하고 재로드가 없어 이 조합이 재현되지 않는다.
 *
 * production build 위에서 돈다. 대기는 전부 조건 기반이다.
 */
const header = (page: import('@playwright/test').Page) => page.getByRole('banner');

const firstCard = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: '상품 검색 결과' }).locator('article').first();

test.describe('항목 15 — 담기 흐름', () => {
  test('목록에서 상품을 담으면 헤더 장바구니 개수가 1이 되고 버튼이 담김으로 바뀐다', async ({ page }) => {
    await page.goto('/products');

    await expect(header(page).getByText('장바구니 0')).toBeVisible();

    const card = firstCard(page);
    const addButton = card.getByRole('button', { name: /장바구니$/ });
    await addButton.click();

    await expect(header(page).getByText('장바구니 1')).toBeVisible();
    await expect(addButton).toHaveAttribute('aria-pressed', 'true');
    await expect(addButton).toHaveText('담김');
  });

  test('담은 뒤 새로고침해도 헤더 개수와 버튼 상태가 유지된다', async ({ page }) => {
    await page.goto('/products');

    const addButton = firstCard(page).getByRole('button', { name: /장바구니$/ });
    await addButton.click();
    await expect(header(page).getByText('장바구니 1')).toBeVisible();

    await page.reload();

    await expect(header(page).getByText('장바구니 1')).toBeVisible();
    await expect(firstCard(page).getByRole('button', { name: /장바구니$/ })).toHaveAttribute('aria-pressed', 'true');
  });

  // 경계 — 다른 화면으로 갔다 돌아와도 개수가 유지돼야 한다
  test('홈으로 갔다가 목록으로 돌아와도 헤더 개수가 유지된다', async ({ page }) => {
    await page.goto('/products');

    await firstCard(page)
      .getByRole('button', { name: /장바구니$/ })
      .click();
    await expect(header(page).getByText('장바구니 1')).toBeVisible();

    await header(page).getByRole('link', { name: 'Commerce' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(header(page).getByText('장바구니 1')).toBeVisible();

    await header(page).getByRole('link', { name: '상품' }).click();

    await expect(header(page).getByText('장바구니 1')).toBeVisible();
  });

  // 경계 — 다시 누르면 빠지고, 그 상태도 새로고침을 견뎌야 한다
  test('담은 상품을 다시 눌러 빼면 새로고침 후에도 0으로 남는다', async ({ page }) => {
    await page.goto('/products');

    const addButton = firstCard(page).getByRole('button', { name: /장바구니$/ });
    await addButton.click();
    await expect(header(page).getByText('장바구니 1')).toBeVisible();

    await addButton.click();
    await expect(header(page).getByText('장바구니 0')).toBeVisible();

    await page.reload();

    await expect(header(page).getByText('장바구니 0')).toBeVisible();
  });
});
