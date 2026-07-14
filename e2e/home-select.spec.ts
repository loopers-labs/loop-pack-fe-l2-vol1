import { test, expect, type Locator } from '@playwright/test'

/*
 * toBeVisible() only checks layout, not whether the <img>'s src actually loaded —
 * next/image silently 400s on local SVGs unless `unoptimized` is set, and a visible-but-broken
 * <img> still passes toBeVisible(). This checks the browser actually decoded pixels.
 */
const expectImageLoaded = async (image: Locator) => {
  await expect(image).toBeVisible()
  const isLoaded = await image.evaluate(
    (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
  )
  expect(isLoaded).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('renders all three select triggers with a loaded toggle icon', async ({ page }) => {
  const textTrigger = page.getByRole('button', { name: '옵션 선택' })
  const sizeTrigger = page.getByRole('button', { name: '사이즈' })
  const thumbnailTrigger = page.getByRole('button', { name: '옵션을 선택해 주세요' })

  await expect(textTrigger).toBeVisible()
  await expect(sizeTrigger).toBeVisible()
  await expect(thumbnailTrigger).toBeVisible()

  await expectImageLoaded(textTrigger.locator('img'))
  await expectImageLoaded(sizeTrigger.locator('img'))
  await expectImageLoaded(thumbnailTrigger.locator('img'))
})

test('TextOptionSelect: click opens, click-select closes it, reflects on reopen, and shows the selected value below', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: '옵션 선택' })
  const container = trigger.locator('..')
  const wrapper = trigger.locator('../..')

  await trigger.click()
  const options = container.getByRole('option')
  await expect(options).toHaveCount(2)
  // textContent()는 null을 반환할 수 있으나, 위에서 옵션 개수(2개)를 이미 검증했으므로 빈 문자열로 대체
  const firstOptionText = ((await options.nth(0).textContent()) ?? '').trim()

  await expect(wrapper.getByTestId('selected')).toHaveCount(0)

  await options.nth(0).click()
  await expect(container.getByRole('listbox')).toBeHidden()

  const selectedSummary = wrapper.getByTestId('selected')
  await expect(selectedSummary).toBeVisible()
  await expect(selectedSummary).toContainText(firstOptionText.slice(0, 4))

  await trigger.click()
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true')
})

test('SizeOptionSelect: click then ArrowDown skips the sold-out size, Enter selects it, and shows it below', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: '사이즈' })
  const container = trigger.locator('..')
  const wrapper = trigger.locator('../..')

  await trigger.click()
  const options = container.getByRole('option')
  await expect(options).toHaveCount(5)
  // API data: 24(stock 3), 25(stock 0), 26(stock 12), 27(stock 5), 28(stock 0)
  await expect(options.nth(1)).toHaveAttribute('aria-disabled', 'true')

  // opening highlights 24 (index 0); ArrowDown must skip disabled 25 and land on 26 (index 2)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await expect(container.getByRole('listbox')).toBeHidden()
  await expect(wrapper.getByTestId('selected')).toContainText('26')

  await trigger.click()
  await expect(options.nth(2)).toHaveAttribute('aria-selected', 'true')
})

test('SizeOptionSelect: Escape closes without selecting', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '사이즈' })
  const container = trigger.locator('..')
  const wrapper = trigger.locator('../..')

  await trigger.click()
  await expect(container.getByRole('listbox')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(container.getByRole('listbox')).toBeHidden()
  await expect(wrapper.getByTestId('selected')).toHaveCount(0)
})

test('ThumbnailOptionSelect: click opens, renders the option thumbnail, click-select closes it and shows it below', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: '옵션을 선택해 주세요' })
  const container = trigger.locator('..')
  const wrapper = trigger.locator('../..')

  await trigger.click()
  const options = container.getByRole('option')
  // mock data: p1/p2 (discountRate), p3-p5 (badge+bundleBadge), p6 (soldOut)
  await expect(options).toHaveCount(6)
  await expectImageLoaded(options.nth(0).locator('img'))

  await options.nth(0).click()
  await expect(container.getByRole('listbox')).toBeHidden()

  const selectedSummary = wrapper.getByTestId('selected')
  await expect(selectedSummary).toBeVisible()
  await expectImageLoaded(selectedSummary.locator('img'))
})

test('ThumbnailOptionSelect: sold-out option cannot be selected by click', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '옵션을 선택해 주세요' })
  const container = trigger.locator('..')

  await trigger.click()
  const options = container.getByRole('option')
  const soldOutOption = options.nth(5)
  await expect(soldOutOption).toHaveAttribute('aria-disabled', 'true')

  /*
   * real browsers don't block a click just because aria-disabled is set (only assistive tech
   * and Playwright's default actionability checks do) — force it to match what a real user could
   * do, and confirm the component's own isOptionDisabled guard is what actually prevents selection.
   */
  await soldOutOption.click({ force: true })
  await expect(container.getByRole('listbox')).toBeVisible()
  await expect(soldOutOption).toHaveAttribute('aria-selected', 'false')
})

test('TextOptionSelect: clicking outside the container closes the open list', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '옵션 선택' })
  const container = trigger.locator('..')

  await trigger.click()
  await expect(container.getByRole('listbox')).toBeVisible()

  await page.getByRole('heading', { name: '동작 확인' }).click()
  await expect(container.getByRole('listbox')).toBeHidden()
})

test('opening a second select closes the first one that was left open', async ({ page }) => {
  const textTrigger = page.getByRole('button', { name: '옵션 선택' })
  const sizeTrigger = page.getByRole('button', { name: '사이즈' })
  const textContainer = textTrigger.locator('..')
  const sizeContainer = sizeTrigger.locator('..')

  await textTrigger.click()
  await expect(textContainer.getByRole('listbox')).toBeVisible()

  await sizeTrigger.click()
  await expect(textContainer.getByRole('listbox')).toBeHidden()
  await expect(sizeContainer.getByRole('listbox')).toBeVisible()
})

test('TextOptionSelect: clearing the selection removes the summary and resets aria-selected', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: '옵션 선택' })
  const container = trigger.locator('..')
  const wrapper = trigger.locator('../..')

  await trigger.click()
  const options = container.getByRole('option')
  await options.nth(0).click()

  const selectedSummary = wrapper.getByTestId('selected')
  await expect(selectedSummary).toBeVisible()

  await selectedSummary.getByRole('button', { name: '선택 해제' }).click()
  await expect(selectedSummary).toHaveCount(0)

  await trigger.click()
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'false')
})
