import { expect, test } from '@playwright/test'

test('shows the commerce home heading', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Loopers Commerce', level: 1 }),
  ).toBeVisible()
})
