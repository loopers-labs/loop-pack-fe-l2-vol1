import { expect, test } from '@playwright/test';
import { seedCartState, TEST_CART_PRODUCT } from './fixtures/cartState';

test.describe('장바구니', () => {
  test('로그인하면 비회원 장바구니 상품을 주문서에 유지한다', async ({
    page,
  }) => {
    await seedCartState(page, 'guest', [
      { id: TEST_CART_PRODUCT.id, quantity: 1 },
    ]);
    await page.goto('/cart');

    await expect(
      page.getByRole('link', {
        name: TEST_CART_PRODUCT.name,
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole('link', { name: '주문하기' }).click();
    await expect(page).toHaveURL(
      '/login?returnTo=%2Forders%2Fnew&from=cart',
    );
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL('/orders/new');
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
    await expect(page.getByText('총 1개', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: TEST_CART_PRODUCT.name,
        exact: true,
      }),
    ).toBeVisible();
  });
});
