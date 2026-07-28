import { expect, test, type Page } from '@playwright/test'

const expectSearchParam = async (page: Page, key: string, value: string | null) => {
  await expect.poll(() => new URL(page.url()).searchParams.get(key)).toBe(value)
}

const LONG_SEARCH_QUERY = '없는상품'.repeat(250)

test.describe('5주차 상태 연동', () => {
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

  test('홈의 찜·담기 상태가 목록과 새로고침 후에도 유지된다', async ({ page }) => {
    await page.goto('/')

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

    await page.getByRole('link', { name: '디지털', exact: true }).click()
    await expect(page).toHaveURL(/\/products\?category=digital$/)
    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('digital')
    await expect(
      page.getByRole('button', { name: '메이커스 투명케이스 위시리스트' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', { name: '메이커스 투명케이스 장바구니' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('찜 해제는 장바구니와 독립적으로 반영되고 새로고침 후에도 유지된다', async ({ page }) => {
    await page.goto('/')

    const wishlistButton = page.getByRole('button', {
      name: '메이커스 투명케이스 위시리스트',
    })
    const cartButton = page.getByRole('button', {
      name: '메이커스 투명케이스 장바구니',
    })

    await wishlistButton.click()
    await expect(page.getByText('위시리스트 1', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 0', { exact: true })).toBeVisible()
    await expect(cartButton).toHaveAttribute('aria-pressed', 'false')

    await wishlistButton.click()
    await expect(wishlistButton).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('위시리스트 0', { exact: true })).toBeVisible()

    await page.reload()

    await expect(page.getByText('위시리스트 0', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 0', { exact: true })).toBeVisible()
    await expect(wishlistButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('검색·카테고리·정렬 변경은 URL과 목록을 갱신하고 page를 1로 되돌린다', async ({ page }) => {
    await page.goto('/products?page=2')

    await expect(page.getByText('2 / 3', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: '검색' }).pressSequentially('스탠리', { delay: 30 })

    expect(new URL(page.url()).searchParams.get('q')).toBeNull()
    expect(new URL(page.url()).searchParams.get('page')).toBe('2')

    await expectSearchParam(page, 'q', '스탠리')
    await expectSearchParam(page, 'page', null)
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()

    await page.getByRole('combobox', { name: '정렬' }).selectOption('price-desc')
    await expectSearchParam(page, 'sort', 'price-desc')
    await expectSearchParam(page, 'page', null)

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('home')
    await expectSearchParam(page, 'category', 'home')
    await expectSearchParam(page, 'q', '스탠리')
    await expectSearchParam(page, 'sort', 'price-desc')
    await expectSearchParam(page, 'page', null)
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()
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
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()
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

  test('조건 변경 중에는 이전 목록을 유지하고 새 응답 후 교체한다', async ({ page }) => {
    await page.goto('/products')

    const previousProduct = page.getByRole('heading', {
      name: 'Margaret Sweatshirt - Oatmeal',
    })
    await expect(previousProduct).toBeVisible()

    let releaseResponse: (() => void) | undefined
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })

    await page.route('**/api/products?**', async (route) => {
      const requestUrl = new URL(route.request().url())

      if (requestUrl.searchParams.get('category') === 'digital') {
        await responseGate
      }

      await route.continue()
    })

    await page.getByRole('combobox', { name: '카테고리' }).selectOption('digital')

    await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    await expect(previousProduct).toBeVisible()

    if (!releaseResponse) {
      throw new Error('상품 응답 해제 함수를 준비하지 못했습니다.')
    }
    releaseResponse()

    await expect(page.getByText('총 6개', { exact: true })).toBeVisible()
    await expect(page.locator('[aria-busy="false"]')).toBeVisible()
    await expect(previousProduct).toHaveCount(0)
  })
})

test.describe('5주차 예외와 복구', () => {
  test('검색어를 모두 지우면 debounce 후 q를 제거하고 전체 목록으로 복원한다', async ({ page }) => {
    await page.goto('/products?q=스탠리')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await expect(searchInput).toHaveValue('스탠리')
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()

    await searchInput.clear()

    // debounce가 끝나기 전에는 기존 검색 조건과 결과를 유지한다.
    expect(new URL(page.url()).searchParams.get('q')).toBe('스탠리')

    await expectSearchParam(page, 'q', null)
    await expect(searchInput).toHaveValue('')
    await expect(page.getByText('총 30개', { exact: true })).toBeVisible()
  })

  test('존재하지 않는 상품을 검색하면 명시적인 빈 상태를 표시한다', async ({ page }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill('존재하지 않는 상품')

    await expectSearchParam(page, 'q', '존재하지 않는 상품')
    await expect(searchInput).toHaveValue('존재하지 않는 상품')
    await expect(page.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '페이지 이동' })).toHaveCount(0)
  })

  test('매우 긴 검색어도 입력과 URL을 보존하고 빈 상태로 안전하게 처리한다', async ({ page }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill(LONG_SEARCH_QUERY)

    await expectSearchParam(page, 'q', LONG_SEARCH_QUERY)
    await expect(searchInput).toHaveValue(LONG_SEARCH_QUERY)
    await expect(page.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '페이지 이동' })).toHaveCount(0)
  })

  test('공백과 URL 예약 문자가 포함된 검색어도 하나의 q 값으로 보존한다', async ({ page }) => {
    await page.goto('/products')

    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill('  스탠리  ')

    await expectSearchParam(page, 'q', '  스탠리  ')
    await expect(page.getByText('총 4개', { exact: true })).toBeVisible()

    await searchInput.fill('&?%#')

    await expectSearchParam(page, 'q', '&?%#')
    await expect.poll(() => [...new URL(page.url()).searchParams.keys()]).toEqual(['q'])
    await expect(page.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible()
  })

  test('debounce 대기 중 페이지를 떠나면 검색어 변경을 취소한다', async ({ page }) => {
    await page.goto('/products')

    await page.getByRole('textbox', { name: '검색' }).fill('스탠리')
    await page.getByRole('link', { name: 'Commerce' }).click()

    await expect(page).toHaveURL('/')
    await page.waitForTimeout(400)
    await expect(page).toHaveURL('/')
  })

  test('지원하지 않는 카테고리와 정렬 값은 기본 조건으로 복구한다', async ({ page }) => {
    await page.goto('/products?category=unknown&sort=random')

    await expect(page.getByRole('combobox', { name: '카테고리' })).toHaveValue('all')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('latest')
    await expect(page.getByText('총 30개', { exact: true })).toBeVisible()
    await expect(page.getByText('상품 목록을 불러오지 못했어요.', { exact: true })).toHaveCount(0)
  })

  test('허용 범위를 벗어난 숫자 조건은 제어된 오류 상태로 처리한다', async ({ page }) => {
    await page.goto('/products?page=0')

    await expect(page.getByText('상품 목록을 불러오지 못했어요.', { exact: true })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })

  test('마지막 페이지를 초과하면 빈 상태와 함께 앞 페이지로 돌아갈 수단을 남긴다', async ({
    page,
  }) => {
    await page.goto('/products?page=999')

    await expect(page.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible()

    // 검색 결과 자체는 있으므로(총 30개) 페이지네이션으로 앞 페이지에 다시 접근할 수 있어야 한다.
    await page.getByRole('button', { name: '이전' }).click()
    await expect(page).toHaveURL('/products?page=998')
  })

  test('검색 결과가 0건이면 페이지네이션을 표시하지 않는다', async ({ page }) => {
    await page.goto('/products?q=존재하지않는상품명')

    await expect(page.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '페이지 이동' })).toHaveCount(0)
  })

  test('상품 API가 반복 실패하면 오류를 표시하고 다시 시도해 복구한다', async ({ page }) => {
    let requestCount = 0

    await page.route('**/api/products?**', async (route) => {
      requestCount += 1

      if (requestCount <= 4) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: '상품 목록을 불러오지 못했습니다.' }),
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products')

    const retryButton = page.getByRole('button', { name: '다시 시도' })
    await expect(retryButton).toBeVisible({ timeout: 20_000 })
    expect(requestCount).toBe(4)

    await retryButton.click()

    await expect(page.getByText('총 30개', { exact: true })).toBeVisible()
    await expect(retryButton).toHaveCount(0)
  })

  test('손상된 persist 저장값은 빈 장바구니·위시리스트로 복구한다', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify({ state: { ids: ['p21', 42] }, version: 1 }))
      localStorage.setItem('wishlist', JSON.stringify({ state: { ids: 'p21' }, version: 1 }))
    })

    await page.goto('/')

    await expect(page.getByText('위시리스트 0', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 0', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '메이커스 투명케이스 위시리스트' }),
    ).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('button', { name: '메이커스 투명케이스 장바구니' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  test('이전 버전의 persist 저장값을 현재 상태로 migration한다', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('wishlist', JSON.stringify({ state: { ids: ['p21'] }, version: 0 }))
    })

    await page.goto('/')

    await expect(page.getByText('위시리스트 1', { exact: true })).toBeVisible()
    await expect(page.getByText('장바구니 0', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '메이커스 투명케이스 위시리스트' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
