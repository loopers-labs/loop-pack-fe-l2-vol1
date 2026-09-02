import { expect, test } from '@playwright/test'

import { parallelAccount, signIn } from './support/auth'

const productName = 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'

test('Cart persistence - when a shopper reloads and passes through the login redirect - keeps the added product', async ({
  page,
}, testInfo) => {
  // Arrange
  const account = parallelAccount(testInfo.parallelIndex)
  const cartButton = page.getByRole('button', {
    name: `${productName} 장바구니`,
  })
  await page.goto('/products')
  await cartButton.click()
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()

  // Act - 전체 새로고침으로 저장소에서 다시 읽는다
  await page.reload()

  // Assert
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await expect(cartButton).toHaveText('빼기')

  // Act - 로그인 리다이렉트 왕복
  await page.goto('/checkout')
  await expect(page).toHaveURL('/login?next=%2Fcheckout')
  await signIn(page, account.email)
  await page.waitForURL('/checkout')

  // Assert
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await expect(page.getByText('수량 1')).toBeVisible()

  // Act - 같은 상품을 다시 담아도 수량이 늘지 않는다
  await page.goto('/products')
  await cartButton.click()
  await expect(page.getByLabel('장바구니 0개')).toBeVisible()
  await cartButton.click()

  // Assert
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText('수량 1')).toBeVisible()
})
