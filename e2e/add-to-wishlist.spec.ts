import { expect, test } from './fixtures/worker-auth'
import { productListPath, WISHLIST_TEST_PRODUCT } from './fixtures/test-products'

test('찜한 상품이 위시리스트와 새로고침 후에도 남는다', async ({ page }) => {
  await page.goto(productListPath(WISHLIST_TEST_PRODUCT))

  const wishlistButton = page.getByRole('button', {
    name: `${WISHLIST_TEST_PRODUCT.name} 위시리스트`,
  })
  await wishlistButton.click()
  await expect(wishlistButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('link', { name: '위시리스트 1' })).toBeVisible()

  await page.goto('/wishlist?entryPoint=direct')
  await expect(
    page.getByRole('heading', { level: 2, name: WISHLIST_TEST_PRODUCT.name }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '위시리스트 1' })).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole('heading', { level: 2, name: WISHLIST_TEST_PRODUCT.name }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '위시리스트 1' })).toBeVisible()
})
