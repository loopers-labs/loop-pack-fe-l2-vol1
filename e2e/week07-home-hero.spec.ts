import { expect, test } from '@playwright/test'

test('모바일 첫 화면의 Hero 이미지가 사용자 상호작용 없이 로드된다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 823 })
  await page.goto('/')

  const heroImage = page.locator('main section img').first()
  await expect(heroImage).toBeVisible()
  await expect
    .poll(
      () => heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
      { timeout: 5000 },
    )
    .toBeGreaterThan(0)
})
