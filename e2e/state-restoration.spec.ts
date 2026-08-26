import { expect, test, type Page } from '@playwright/test'

const expectSearchParam = async (page: Page, key: string, value: string | null) => {
  await expect.poll(() => new URL(page.url()).searchParams.get(key)).toBe(value)
}

const LONG_SEARCH_QUERY = '없는상품'.repeat(250)

// 계획서 11·13·14·15번 — docs/rfc/week08-test-plan.md
test.describe('URL·스토리지에 담긴 상태 복원', () => {
  test('홈 데이터는 hydration 후 브라우저에서 중복 요청하지 않는다', async ({ page }) => {
    let browserHomeRequestCount = 0

    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/home') {
        browserHomeRequestCount += 1
      }
    })

    await page.goto('/')

    await expect(page.getByRole('heading', { name: '매일 새롭게 발견하는 취향' })).toBeVisible()
    expect(browserHomeRequestCount).toBe(0)
  })

  test('목록에서 찜·담기한 상태가 헤더와 새로고침 후에도 유지된다', async ({ page }) => {
    await page.goto('/products?category=digital')

    const wishlistButton = page.getByRole('button', {
      name: '메이커스 투명케이스 위시리스트',
    })
    const cartButton = page.getByRole('button', {
      name: '메이커스 투명케이스 장바구니',
    })

    await wishlistButton.click()
    await cartButton.click()

    await expect(wishlistButton).toHaveAttribute('aria-pressed', 'true')
    await expect(cartButton).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('위시리스트 1', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 1', { exact: true })).toBeVisible()

    await page.reload()

    await expect(page.getByText('위시리스트 1', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 1', { exact: true })).toBeVisible()

    await expect(wishlistButton).toHaveAttribute('aria-pressed', 'true')
    await expect(cartButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('검색·카테고리·정렬 URL을 새 컨텍스트와 새로고침에서 복원한다', async ({
    browser,
    page,
  }) => {
    await page.goto('/products?page=2')

    await page.getByRole('textbox', { name: '검색' }).pressSequentially('스탠리', { delay: 30 })

    expect(new URL(page.url()).searchParams.get('q')).toBeNull()
    expect(new URL(page.url()).searchParams.get('page')).toBe('2')

    await expectSearchParam(page, 'q', '스탠리')
    await expectSearchParam(page, 'page', null)

    await page.getByRole('combobox', { name: '정렬' }).selectOption('price-desc')
    await expectSearchParam(page, 'sort', 'price-desc')
    await expectSearchParam(page, 'page', null)

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('home')
    await expectSearchParam(page, 'category', 'home')
    await expectSearchParam(page, 'q', '스탠리')
    await expectSearchParam(page, 'sort', 'price-desc')
    await expectSearchParam(page, 'page', null)

    const sharedUrl = page.url()
    const sharedContext = await browser.newContext()

    try {
      const sharedPage = await sharedContext.newPage()
      await sharedPage.goto(sharedUrl)

      await expect(sharedPage.getByRole('textbox', { name: '검색' })).toHaveValue('스탠리')
      await expect(sharedPage.getByRole('combobox', { name: '카테고리' })).toHaveValue('home')
      await expect(sharedPage.getByRole('combobox', { name: '정렬' })).toHaveValue('price-desc')
      await expect(sharedPage.getByText('총 4개', { exact: true })).toBeVisible()
    } finally {
      await sharedContext.close()
    }

    await page.reload()

    await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue('스탠리')
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('home')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('price-desc')

    await page.getByRole('textbox', { name: '검색' }).clear()
    await expectSearchParam(page, 'q', null)
    await page.reload()

    await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue('')
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('home')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('price-desc')
  })

  test('검색 debounce 대기 중 필터와 정렬을 바꿔도 모든 조건을 함께 유지한다', async ({ page }) => {
    await page.goto('/products?page=2')

    await expect(page.getByText('2 / 3', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: '검색' }).pressSequentially('스탠리', { delay: 20 })

    // debounce가 끝나기 전에는 검색어와 page가 아직 기존 URL에 남아 있다.
    expect(new URL(page.url()).searchParams.get('q')).toBeNull()
    expect(new URL(page.url()).searchParams.get('page')).toBe('2')

    await page.getByRole('combobox', { name: '정렬' }).selectOption('price-desc')
    await page.getByRole('combobox', { name: '카테고리' }).selectOption('home')

    // 필터 변경과 늦게 반영된 검색어가 서로 덮어쓰지 않고 하나의 조회 조건으로 합쳐진다.
    await expectSearchParam(page, 'q', '스탠리')
    await expectSearchParam(page, 'category', 'home')
    await expectSearchParam(page, 'sort', 'price-desc')
    await expectSearchParam(page, 'page', null)
    await expect(page.getByRole('textbox', { name: '검색' })).toHaveValue('스탠리')
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('home')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('price-desc')
  })

  test('debounce가 끝난 검색어는 뒤로·앞으로 이동에서 검색 결과와 함께 복원된다', async ({
    page,
  }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill('스탠리')
    await expectSearchParam(page, 'q', '스탠리')
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()

    await searchInput.fill('메이커스')
    await expectSearchParam(page, 'q', '메이커스')
    await expect(page.getByText('총 1개', { exact: true })).toBeVisible()

    await page.goBack()
    await expectSearchParam(page, 'q', '스탠리')
    await expect(searchInput).toHaveValue('스탠리')
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()

    await page.goForward()
    await expectSearchParam(page, 'q', '메이커스')
    await expect(searchInput).toHaveValue('메이커스')
    await expect(page.getByText('총 1개', { exact: true })).toBeVisible()
  })

  test('페이지네이션 경계와 뒤로·앞으로 이동에서 URL 상태가 복원된다', async ({ page }) => {
    await page.goto('/products')

    const previousButton = page.getByRole('button', { name: '이전' })
    const nextButton = page.getByRole('button', { name: '다음' })

    await expect(previousButton).toBeDisabled()
    await nextButton.click()
    await expectSearchParam(page, 'page', '2')
    await expect(page.getByText('2 / 3', { exact: true })).toBeVisible()

    await nextButton.click()
    await expectSearchParam(page, 'page', '3')
    await expect(nextButton).toBeDisabled()

    await page.getByRole('combobox', { name: '정렬' }).selectOption('popular')
    await expectSearchParam(page, 'sort', 'popular')
    await expectSearchParam(page, 'page', null)

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('digital')
    await expectSearchParam(page, 'category', 'digital')

    await page.goBack()
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('all')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('popular')

    await page.goForward()
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('digital')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('popular')
  })
})

test.describe('검색어 예외와 복구', () => {
  test('검색어를 모두 지우면 debounce 후 q를 제거하고 전체 목록으로 복원한다', async ({ page }) => {
    await page.goto('/products?q=스탠리')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await expect(searchInput).toHaveValue('스탠리')
    await searchInput.clear()

    // debounce가 끝나기 전에는 기존 검색 조건과 결과를 유지한다.
    expect(new URL(page.url()).searchParams.get('q')).toBe('스탠리')

    await expectSearchParam(page, 'q', null)
    await expect(searchInput).toHaveValue('')
  })

  test('매우 긴 검색어도 입력과 URL을 보존하고 빈 상태로 안전하게 처리한다', async ({ page }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill(LONG_SEARCH_QUERY)

    await expectSearchParam(page, 'q', LONG_SEARCH_QUERY)
    await expect(searchInput).toHaveValue(LONG_SEARCH_QUERY)
  })

  test('공백과 URL 예약 문자가 포함된 검색어도 하나의 q 값으로 보존한다', async ({ page }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill('  스탠리  ')

    await expectSearchParam(page, 'q', '  스탠리  ')
    await searchInput.fill('&?%#')

    await expectSearchParam(page, 'q', '&?%#')
    await expect.poll(() => [...new URL(page.url()).searchParams.keys()]).toEqual(['q'])
  })
})
