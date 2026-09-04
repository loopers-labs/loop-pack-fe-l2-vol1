import type { APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'

import type { ProductListResponse } from '@/entities/product/model/types'

import { trackedEventNames } from './support/auth'
import { test } from './support/authenticatedTest'

const productName = 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'

// 주문 내역은 상품 id로 렌더링된다. 화면 순서에 기대지 않도록 id를 API로 확인한다.
async function resolveProductId(request: APIRequestContext, name: string) {
  const response = await request.get(
    `/api/products?q=${encodeURIComponent(name)}`,
  )
  expect(response.ok()).toBe(true)
  const body = (await response.json()) as ProductListResponse
  const product = body.products.at(0)
  if (product === undefined) {
    throw new Error(`상품을 찾지 못했다: ${name}`)
  }
  return product.id
}

test('Purchase completion - when an authenticated shopper adds a product - records the order and empties the cart', async ({
  page,
  request,
}) => {
  // Arrange
  const productId = await resolveProductId(request, productName)
  await page.goto('/products')
  await page.getByRole('button', { name: `${productName} 장바구니` }).click()
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await page.goto('/checkout')
  await expect(page.getByText('수량 1')).toBeVisible()

  // Act
  await page.getByRole('button', { name: '주문하기' }).click()

  // Assert
  await page.waitForURL('/orders')
  await expect(
    page.getByRole('listitem').filter({ hasText: `${productId} × 1` }),
  ).not.toHaveCount(0)
  await expect(page.getByLabel('장바구니 0개')).toBeVisible()
  expect(await trackedEventNames(page)).toContain('order_complete')

  // Assert - 새로고침해도 비워진 장바구니가 유지된다
  await page.reload()
  await expect(page.getByLabel('장바구니 0개')).toBeVisible()
})
