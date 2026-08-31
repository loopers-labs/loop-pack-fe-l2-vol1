import { expect, test } from '@playwright/test'

const stanleyLunchbox = '스탠리 클래식 런치박스'
const fashionPullover = 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('commerce-cart')
    localStorage.removeItem('commerce-wishlist')
  })
})

test('Product list filter sharing - when a category URL is reopened - restores the selected filter and matching products', async ({
  page,
}) => {
  // Arrange
  await page.goto('/products')
  await page.getByRole('combobox', { name: '카테고리' }).selectOption('home')
  await page.waitForURL(/category=home/)
  const sharedUrl = page.url()

  // Act
  await page.goto(sharedUrl)

  // Assert
  await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
    'home',
  )
  await expect(
    page.getByRole('heading', { name: stanleyLunchbox }),
  ).toBeVisible()
})

test('Product list URL hydration - when the default URL is entered directly - shows the default filters and products', async ({
  page,
}) => {
  // Arrange
  const defaultProduct = page.getByRole('heading', { name: fashionPullover })

  // Act
  await page.goto('/products')

  // Assert
  await defaultProduct.waitFor()
  await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
    'all',
  )
  await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
    'latest',
  )
  await expect(defaultProduct).toBeVisible()
})

test('Product list browser history - when the browser moves back after two filter changes - restores the previous filter and result', async ({
  page,
}) => {
  // Arrange
  await page.goto('/products')
  const category = page.getByRole('combobox', { name: '카테고리' })
  await category.selectOption('home')
  await page.waitForURL(/category=home/)
  await page.getByRole('heading', { name: stanleyLunchbox }).waitFor()
  await category.selectOption('fashion')
  await page.waitForURL(/category=fashion/)
  await page.getByRole('heading', { name: fashionPullover }).waitFor()

  // Act
  await page.goBack()

  // Assert
  await expect(category).toHaveValue('home')
  await expect(
    page.getByRole('heading', { name: stanleyLunchbox }),
  ).toBeVisible()
})

test('Product list browser history - when the browser moves forward after returning to the previous filter - restores the later filter and result', async ({
  page,
}) => {
  // Arrange
  await page.goto('/products')
  const category = page.getByRole('combobox', { name: '카테고리' })
  await category.selectOption('home')
  await page.waitForURL(/category=home/)
  await page.getByRole('heading', { name: stanleyLunchbox }).waitFor()
  await category.selectOption('fashion')
  await page.waitForURL(/category=fashion/)
  await page.getByRole('heading', { name: fashionPullover }).waitFor()
  await page.goBack()
  await page.waitForURL(/category=home/)
  await page.getByRole('heading', { name: stanleyLunchbox }).waitFor()

  // Act
  await page.goForward()

  // Assert
  await expect(category).toHaveValue('fashion')
  await expect(
    page.getByRole('heading', { name: fashionPullover }),
  ).toBeVisible()
})

test('Product list URL hydration - when a filtered document reloads - retains the filters and matching result', async ({
  page,
}) => {
  // Arrange
  await page.goto('/products?category=home&q=%EC%8A%A4%ED%83%A0%EB%A6%AC')
  await page.getByRole('heading', { name: stanleyLunchbox }).waitFor()

  // Act
  await page.reload()

  // Assert
  await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue(
    '스탠리',
  )
  await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
    'home',
  )
  await expect(
    page.getByRole('heading', { name: stanleyLunchbox }),
  ).toBeVisible()
})

test('Product list URL normalization - when a document with invalid filters reloads - keeps normalized defaults available', async ({
  page,
}) => {
  // Arrange
  await page.goto('/products?category=unknown&sort=oldest&page=0')

  // Act
  await page.reload()

  // Assert
  await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue(
    'all',
  )
  await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue(
    'latest',
  )
  await expect(page.getByRole('button', { name: '이전' })).toBeDisabled()
  await expect(
    page.getByRole('heading', { name: fashionPullover }),
  ).toBeVisible()
})

test('Product list cart control - when a shopper adds a product - updates the Header count and button state', async ({
  page,
}) => {
  // Arrange
  await page.goto('/')
  await page.getByRole('link', { name: '상품', exact: true }).click()
  const cartButton = page.getByRole('button', {
    name: `${fashionPullover} 장바구니`,
  })
  await cartButton.waitFor()

  // Act
  await cartButton.click()

  // Assert
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await expect(cartButton).toHaveText('빼기')
})

test('Product list cart control - when a shopper removes an added product - updates the Header count and button state', async ({
  page,
}) => {
  // Arrange
  await page.goto('/')
  await page.getByRole('link', { name: '상품', exact: true }).click()
  const cartButton = page.getByRole('button', {
    name: `${fashionPullover} 장바구니`,
  })
  await cartButton.waitFor()
  await cartButton.click()
  await cartButton.getByText('빼기', { exact: true }).waitFor()

  // Act
  await cartButton.click()

  // Assert
  await expect(page.getByLabel('장바구니 0개')).toBeVisible()
  await expect(cartButton).toHaveText('담기')
})
