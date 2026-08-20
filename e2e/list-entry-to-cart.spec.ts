import { test, expect } from '@playwright/test';

test('목록에 진입해 담기를 누르면 헤더 개수가 반영된다', async ({ page }) => {
  await page.goto('/');

  // 실제 라우팅으로 목록 페이지 진입
  await page.getByRole('link', { name: '상품' }).click();
  await expect(page).toHaveURL(/\/products/);

  // 담기 전 헤더는 0
  await expect(page.getByText('장바구니 0')).toBeVisible();

  // 목록의 첫 번째 상품 담기 버튼 클릭 (역할·이름 기반)
  const firstCartButton = page
    .getByRole('button', { name: /장바구니$/ })
    .first();
  await firstCartButton.click();

  // 헤더 개수가 1로 반영되는지 확인
  await expect(page.getByText('장바구니 1')).toBeVisible();
});
