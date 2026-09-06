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

    const createOrderResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/orders') &&
        response.request().method() === 'POST',
    );
    await submitButton.click();
    const response = await createOrderResponse;
    expect(response.ok()).toBe(true);

    const { order } = (await response.json()) as { order: { id: string } };

    await expect(page).toHaveURL('/orders');
    await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
    const createdOrder = page
      .locator('article')
      .filter({ hasText: `주문 번호 ${order.id}` });
    await expect(createdOrder).toHaveCount(1);
    await expect(
      createdOrder.getByRole('link', {
        name: TEST_CART_PRODUCT.name,
        exact: true,
      }),
    ).toBeVisible();
    await expect(createdOrder.getByText('× 1', { exact: true })).toBeVisible();
  });
});
