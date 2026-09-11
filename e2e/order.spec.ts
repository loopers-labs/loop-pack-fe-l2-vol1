import { expect, test } from './auth.fixture';

test.describe('주문', { tag: '@critical' }, () => {
  test('장바구니 수량을 직접 입력하고 바로 구매하면 같은 수량으로 주문된다', async ({
    page,
  }) => {
    await page.goto('/products');

    const firstProduct = page.getByRole('article').first();
    const firstProductName = firstProduct.getByRole('heading', { level: 2 });
    await expect(firstProductName).toBeVisible();
    const productName = await firstProductName.innerText();

    await firstProduct.getByRole('button', { name: /담기$/ }).click();
    const cartLink = page.getByRole('link', { name: '장바구니 1' });
    await expect(cartLink).toBeVisible();
    await cartLink.click();

    await expect(page.getByRole('heading', { name: '장바구니' })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: productName }),
    ).toBeChecked();
    const cartRow = page.getByRole('listitem').filter({
      has: page.getByRole('checkbox', { name: productName, exact: true }),
    });
    const unitPrice = Number(
      (await cartRow.getByText(/^[\d,]+원$/).innerText()).replace(/\D/g, ''),
    );
    const expectedTotal = `${(unitPrice * 12).toLocaleString()}원`;
    const quantityInput = page.getByRole('spinbutton', {
      name: `${productName} 수량`,
      exact: true,
    });
    await quantityInput.clear();
    await expect(quantityInput).toHaveValue('');
    await quantityInput.pressSequentially('12');
    await expect(quantityInput).toBeFocused();
    const cartSummary = page.getByRole('complementary', {
      name: '주문 예상 금액',
    });
    await expect(
      cartSummary.getByText(expectedTotal, { exact: true }),
    ).toHaveCount(2);
    await page.getByRole('button', { name: '총 1개 상품 구매하기' }).click();

    await expect(page).toHaveURL((url) => url.pathname === '/orders/new');
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible();
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await expect(page.getByText('12개', { exact: true })).toBeVisible();
    await expect(page.getByText(expectedTotal, { exact: true })).toHaveCount(2);

    const orderResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/orders',
    );
    await page.getByRole('button', { name: '주문하기' }).click();
    const orderResponse = await orderResponsePromise;
    expect(orderResponse.status()).toBe(201);

    const { order } = (await orderResponse.json()) as {
      order: { id: string };
    };

    await expect(page).toHaveURL((url) => url.pathname === '/orders');
    const createdOrder = page.getByRole('listitem', {
      name: `주문 ${order.id}`,
    });
    await expect(createdOrder).toContainText(productName);
    await expect(createdOrder.getByText('12개', { exact: true })).toBeVisible();

    // 실제 주문이 있어도 첫 HTML은 로딩 상태다. 주문 내역은 브라우저가 조회한다.
    const documentResponse = await page.request.get('/orders');
    expect(documentResponse.status()).toBe(200);
    const html = await documentResponse.text();
    expect(html).toContain('주문 내역을 불러오는 중');
    expect(html).not.toContain(`aria-label="주문 ${order.id}"`);
  });
});
