import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Dialog' }).click()
})

test('uncontrolled: trigger opens it, close button closes it', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '이용 안내 보기' })
  const content = page.getByTestId('uncontrolled-content')

  await expect(content).toBeHidden()
  await trigger.click()
  await expect(content).toBeVisible()

  await page.getByRole('button', { name: '이용 안내 닫기' }).click()
  await expect(content).toBeHidden()
})

test('Escape closes the open dialog', async ({ page }) => {
  const content = page.getByTestId('uncontrolled-content')

  await page.getByRole('button', { name: '이용 안내 보기' }).click()
  await expect(content).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(content).toBeHidden()
})

test('clicking the overlay closes it, but clicking inside the content does not', async ({
  page,
}) => {
  const content = page.getByTestId('uncontrolled-content')
  const overlay = page.getByTestId('uncontrolled-overlay')

  await page.getByRole('button', { name: '이용 안내 보기' }).click()
  await expect(content).toBeVisible()

  await content.click()
  await expect(content).toBeVisible()

  await overlay.click({ position: { x: 5, y: 5 } })
  await expect(content).toBeHidden()
})

test('background scroll is locked while open and restored after close', async ({ page }) => {
  const content = page.getByTestId('uncontrolled-content')
  const getBodyOverflow = () => page.evaluate(() => document.body.style.overflow)

  expect(await getBodyOverflow()).not.toBe('hidden')

  await page.getByRole('button', { name: '이용 안내 보기' }).click()
  await expect(content).toBeVisible()
  expect(await getBodyOverflow()).toBe('hidden')

  await page.keyboard.press('Escape')
  await expect(content).toBeHidden()
  expect(await getBodyOverflow()).not.toBe('hidden')
})

test('controlled: an external button opens it and every close path logs onOpenChange', async ({
  page,
}) => {
  const content = page.getByTestId('controlled-content')
  const eventLog = page.getByTestId('event-log')

  await page.getByRole('button', { name: '외부에서 이벤트 팝업 열기' }).click()
  await expect(content).toBeVisible()
  await expect(eventLog).toContainText('외부 버튼으로 열림')

  await page.getByRole('button', { name: '이벤트 팝업 닫기' }).click()
  await expect(content).toBeHidden()
  await expect(eventLog).toContainText('onOpenChange(false)')
})
