import { expect, test, type Page } from '@playwright/test'

const categorySelect = (page: Page) =>
  page.getByRole('combobox', { name: '카테고리' })

const sortSelect = (page: Page) => page.getByRole('combobox', { name: '정렬' })

const productHeadings = (page: Page) => page.getByRole('heading', { level: 3 })

test('필터 조작이 실제 URL에 반영되고 그 URL로 재진입하면 목록 상태가 복원된다', async ({
  page,
}) => {
  await page.goto('/products')
  await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible()

  await categorySelect(page).selectOption('fashion')
  await sortSelect(page).selectOption('price-asc')
  await expect(page).toHaveURL(/category=fashion/)
  await expect(page).toHaveURL(/sort=price-asc/)
  await expect(page.getByText('총 6개')).toBeVisible()
  await expect(productHeadings(page)).not.toHaveCount(0)
  const sharedUrl = page.url()

  await page.goto('/')
  await page.goto(sharedUrl)

  await expect(categorySelect(page)).toHaveValue('fashion')
  await expect(sortSelect(page)).toHaveValue('price-asc')
  await expect(page.getByText('총 6개')).toBeVisible()
  await expect(productHeadings(page)).not.toHaveCount(0)

  await page.goto('/products?page=2')
  await categorySelect(page).selectOption('fashion')
  await expect(page).toHaveURL(/category=fashion/)
  await expect(page).not.toHaveURL(/page=2/)
  await expect(productHeadings(page)).not.toHaveCount(0)
})

test('브라우저 뒤로·앞으로 가기로 필터와 목록을 복원한다', async ({ page }) => {
  await page.goto('/products')
  await page.getByText(/총 \d+개/).waitFor()

  await categorySelect(page).selectOption('fashion')
  await expect(page).toHaveURL(/category=fashion/)
  await expect(productHeadings(page)).not.toHaveCount(0)
  await categorySelect(page).selectOption('home')
  await expect(page).toHaveURL(/category=home/)
  await expect(productHeadings(page)).not.toHaveCount(0)

  await page.goBack()
  await expect(categorySelect(page)).toHaveValue('fashion')
  await expect(productHeadings(page)).not.toHaveCount(0)

  await page.goForward()
  await expect(categorySelect(page)).toHaveValue('home')
  await expect(productHeadings(page)).not.toHaveCount(0)
})

test('새로고침해도 필터·검색·정렬 상태와 목록을 URL에서 복원한다', async ({
  page,
}) => {
  await page.goto(
    '/products?category=home&q=%EC%8A%A4%ED%83%A0%EB%A6%AC&sort=price-asc',
  )

  await expect(categorySelect(page)).toHaveValue('home')
  await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue(
    '스탠리',
  )
  await expect(sortSelect(page)).toHaveValue('price-asc')
  await expect(productHeadings(page)).not.toHaveCount(0)

  await page.reload()

  await expect(categorySelect(page)).toHaveValue('home')
  await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue(
    '스탠리',
  )
  await expect(sortSelect(page)).toHaveValue('price-asc')
  await expect(productHeadings(page)).not.toHaveCount(0)
})

test('새로고침해도 페이지를 유지하고 유효하지 않은 페이지는 마지막으로 보정한다', async ({
  page,
}) => {
  await page.goto('/products?page=2')
  await expect(
    page.getByRole('button', { name: '2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')

  await expect(page).toHaveURL(/page=2/)

  await page.reload()

  await expect(
    page.getByRole('button', { name: '2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL(/page=2/)

  await page.goto('/products?page=999')
  await expect(page).toHaveURL(/page=3/)
  await expect(
    page.getByRole('button', { name: '3', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(productHeadings(page)).not.toHaveCount(0)
})

test('홈 카테고리에서 목록에 진입해 담으면 루트 헤더 개수가 왕복한다', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('navigation', { name: '카테고리 탐색' })
    .getByRole('link', { name: '캐주얼' })
    .click()
  await expect(page).toHaveURL(/\/products\?category=casual/)

  const firstCartButton = page
    .getByRole('button', { name: /장바구니$/ })
    .first()
  await firstCartButton.click()
  await expect(firstCartButton).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('장바구니 1')).toBeVisible()

  await firstCartButton.click()
  await expect(firstCartButton).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('장바구니 0')).toBeVisible()
})
