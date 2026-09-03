import { expect, test } from './fixtures/authenticatedTest';
import { seedCartState, TEST_CART_PRODUCT } from './fixtures/cartState';

test.describe('주문', () => {
  test('주문을 제출하면 주문 내역에 새 주문이 표시된다', async ({
    page,
    account,
  }) => {
    await seedCartState(page, `user:${encodeURIComponent(account.id)}`, [
      { id: TEST_CART_PRODUCT.id, quantity: 1 },
    ]);

    await page.goto('/orders/new');
    const submitButton = page.getByRole('button', { name: /원 주문하기/ });
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: TEST_CART_PRODUCT.name, exact: true }),
    ).toBeVisible();
  });
});
