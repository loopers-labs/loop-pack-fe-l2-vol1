import { expect, test } from './fixtures'

test('세션 만료는 이유와 원래 경로를 담은 로그인 안내로 보낸다', async ({
  page,
  context,
  baseURL,
}) => {
  if (baseURL === undefined) throw new Error('Playwright baseURL이 필요합니다.')

  await context.addCookies([
    {
      name: 'scenario',
      value: 'expired',
      url: baseURL,
    },
  ])

  await page.goto('/orders')

  await expect(page).toHaveURL(/\/login\?reason=expired&next=%2Forders$/)
  await expect(page.getByRole('status')).toHaveText(
    '로그인 상태를 다시 확인해야 합니다. 다시 로그인해주세요.',
  )
})

test('상품을 담아 주문하면 주문 번호가 화면에 보인다', async ({ page }) => {
  await page.goto('/products')

  const firstProduct = page.getByRole('article').first()
  await expect(firstProduct).toBeVisible()
  await firstProduct.getByRole('button', { name: /bag$/ }).click()
  await page.getByRole('link', { name: 'Bag 1' }).click()

  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
  await page.getByRole('button', { name: '주문하기' }).click()

  await expect(page.getByRole('heading', { name: '주문 완료' })).toBeVisible()
  await expect(page.getByTestId('order-id')).toHaveText(/^o\d+$/)
})
