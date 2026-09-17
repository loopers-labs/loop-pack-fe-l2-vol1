import { expect, test } from '@playwright/test'

test('홈이 응답하고 상품 탐색 링크를 제공한다', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBeLessThan(400)
  await expect(page.getByRole('link', { name: 'Shop' })).toBeVisible()
})

test('상품 목록이 서버 데이터와 함께 열린다', async ({ page }) => {
  const response = await page.goto('/products')

  expect(response?.status()).toBeLessThan(400)
  await expect(page.getByText('30 products')).toBeVisible()
  await expect(page.getByRole('article').first()).toBeVisible()
})

test('로그인 화면이 입력 계약을 제공한다', async ({ page }) => {
  const response = await page.goto('/login')

  expect(response?.status()).toBeLessThan(400)
  await expect(page.getByLabel('이메일')).toBeVisible()
  await expect(page.getByLabel('비밀번호')).toBeVisible()
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
})
