import { expect, test } from '@playwright/test';

// 실제 (commerce) 레이아웃이 헤더를 얹고, 목록 페이지가 그 안에 놓인 상태에서의 여정.
// 통합 테스트(1단계 12번)는 이 조합을 테스트가 직접 만들어 주므로 여기서만 확인된다.
test.describe('목록에서 담기 → 헤더 확인', () => {
  test('상품을 담으면 헤더 장바구니 개수가 오르고 다시 누르면 내려간다 (1단계 15번)', async ({
    page,
  }) => {
    await page.goto('/products');

    const header = page.getByRole('banner');
    await expect(header).toContainText('장바구니 0');

    const firstAddToCart = page
      .getByRole('button', { name: /장바구니$/ })
      .first();
    await expect(firstAddToCart).toHaveText('담기');

    await firstAddToCart.click();
    await expect(header).toContainText('장바구니 1');
    await expect(firstAddToCart).toHaveText('빼기');

    await firstAddToCart.click();
    await expect(header).toContainText('장바구니 0');
    await expect(firstAddToCart).toHaveText('담기');
  });

  test('여러 상품을 담으면 개수가 쌓이고 찜은 별도로 센다 (1단계 15번 · 경계)', async ({
    page,
  }) => {
    await page.goto('/products');

    const header = page.getByRole('banner');
    const addToCartButtons = page.getByRole('button', { name: /장바구니$/ });

    await addToCartButtons.nth(0).click();
    await addToCartButtons.nth(1).click();
    await expect(header).toContainText('장바구니 2');

    await page
      .getByRole('button', { name: /위시리스트$/ })
      .first()
      .click();
    await expect(header).toContainText('위시리스트 1');
    await expect(header).toContainText('장바구니 2');
  });

  test('장바구니는 메모리 전용이라 새로고침하면 비워진다 (현재 계약)', async ({
    page,
  }) => {
    await page.goto('/products');

    await page
      .getByRole('button', { name: /장바구니$/ })
      .first()
      .click();
    await expect(page.getByRole('banner')).toContainText('장바구니 1');

    // 필터는 URL 상태라 새로고침을 넘기지만(13·14번), 장바구니는 persist가 없다.
    // 나중에 persist를 붙이면 이 테스트가 먼저 빨간불이 되어 계약이 바뀌었음을 알린다.
    await page.reload();

    await expect(page.getByRole('banner')).toContainText('장바구니 0');
  });
});
