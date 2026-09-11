import { isRecord } from '@/shared/lib/is-record'
import { expect, test } from './fixtures/worker-auth'
import { CART_TEST_PRODUCT, productListPath } from './fixtures/test-products'

type CreatedOrder = {
  order: { id: string }
}

const isCreatedOrder = (value: unknown): value is CreatedOrder =>
  isRecord(value) && isRecord(value.order) && typeof value.order.id === 'string'

// 주문은 서버 메모리에 계정별로 누적되고 최신이 목록 마지막에 온다. 개수나 순서를 가정하면
// 3회 연속 실행에서 깨지므로, 방금 만든 주문 id로 좁혀 단언한다.
test('장바구니에서 주문하면 그 주문이 주문 내역에 나타난다', async ({ page }) => {
  await page.goto(productListPath(CART_TEST_PRODUCT))
  await page.getByRole('button', { name: `${CART_TEST_PRODUCT.name} 장바구니` }).click()
  await page.getByRole('button', { name: '장바구니 이동' }).click()
  await page.waitForURL('**/cart')

  const orderCreated = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/orders' &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  )

  await page.getByRole('button', { name: '주문하기' }).click()

  const body: unknown = await (await orderCreated).json()
  if (!isCreatedOrder(body)) {
    throw new Error('주문 생성 응답에서 order를 읽지 못했다.')
  }

  await page.waitForURL('**/orders')
  await expect(page.getByText(`주문번호 ${body.order.id}`)).toBeVisible()
})
