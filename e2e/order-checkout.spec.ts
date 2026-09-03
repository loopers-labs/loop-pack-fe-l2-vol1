import { test, expect } from './support/fixtures';

// 3단계 RFC(docs/rfc/week09-e2e-scope.md)에서 고른 "주문" 시나리오: 정상 완료
// 흐름 1개. cartStore(zustand) → API 제출 → 화면 전환이 실제로 맞물리는지가
// 핵심이라, 담기 → 주문서 진입 → 제출 → 완료 확인까지 전체 사슬을 관통한다.
// 로그인 상태(storageState)로 시작한다 — 이 흐름은 이미 보호 경로 안이라
// 로그인 자체를 다시 검증할 필요가 없다.
test('상품을 담아 주문하면 주문내역에서 확인된다', async ({ page }) => {
  await page.goto('/products');

  const firstProduct = page.getByRole('article').first();
  const productName = await firstProduct
    .getByRole('heading', { level: 3 })
    .innerText();

  await firstProduct.getByRole('button', { name: /장바구니$/ }).click();

  await page.getByRole('link', { name: /장바구니 1/ }).click();
  await expect(page).toHaveURL('/orders/new');
  await expect(
    page.getByRole('heading', { name: '주문서', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: productName })).toBeVisible();

  await page.getByRole('button', { name: '주문하기' }).click();

  await expect(page).toHaveURL('/orders');
  await expect(
    page.getByRole('heading', { name: '주문내역', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: productName }).first(),
  ).toBeVisible();
});
