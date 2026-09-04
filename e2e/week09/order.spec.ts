import { expect, test } from './fixtures'

interface CreatedOrderResponse {
  order: {
    id: string
  }
}

test('인증된 사용자가 장바구니 상품으로 주문을 완료한다', async ({
  authenticatedPage: page,
  workerAccount,
}) => {
  await page.goto('/products')
  await expect(
    page.getByText(workerAccount.name, { exact: true }),
  ).toBeVisible()

  const firstCartButton = page
    .getByRole('button', { name: /장바구니$/ })
    .first()
  await firstCartButton.click()
  await expect(firstCartButton).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('link', { name: '장바구니 1' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()

  const orderResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/orders') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  )

  await page.getByRole('button', { name: '주문하기' }).click()
  const orderResponse = await orderResponsePromise
  const { order } = (await orderResponse.json()) as CreatedOrderResponse

  await expect(page).toHaveURL(/\/orders$/)
  const createdOrder = page.getByRole('article', {
    name: `주문 ${order.id}`,
    exact: true,
  })
  await expect(createdOrder).toBeVisible()
  await expect(createdOrder.getByText(`주문 번호: ${order.id}`)).toBeVisible()
})
