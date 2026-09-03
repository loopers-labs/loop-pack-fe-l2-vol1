import { expect, test } from '@playwright/test';

/**
 * 0단계 E2E 하네스 스모크.
 *
 * 13·14·15번 검증 항목은 여기 없다. 이 파일이 증명하는 것은 production build 위에서
 * 브라우저가 뜨고, 실제 mock API 500ms 지연을 지나 목록이 그려지며,
 * 역할·이름 기반 셀렉터로 조작이 된다는 사실뿐이다.
 *
 * sleep 을 쓰지 않는다. 대기는 전부 조건 기반이다.
 */
test('상품 목록에 진입하면 실제 mock API 응답으로 카드가 그려진다', async ({ page }) => {
  await page.goto('/products');

  const results = page.getByRole('region', { name: '상품 검색 결과' });

  // 500ms 실지연을 지나 목록이 도착할 때까지 조건으로 기다린다.
  await expect(results.getByRole('heading', { level: 3 }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '이전' })).toBeDisabled();
});

test('상품을 담으면 헤더의 장바구니 개수가 올라간다', async ({ page }) => {
  await page.goto('/products');

  const header = page.getByRole('banner');
  await expect(header.getByText('장바구니 0')).toBeVisible();

  const firstCard = page.getByRole('region', { name: '상품 검색 결과' }).locator('article').first();
  await firstCard.getByRole('button', { name: /장바구니$/ }).click();

  await expect(header.getByText('장바구니 1')).toBeVisible();
});
