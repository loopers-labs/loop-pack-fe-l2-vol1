import { expect } from '@playwright/test'
import { accountMenu } from './fixtures/login-actions'
import { test as authenticatedTest } from './fixtures/worker-auth'

authenticatedTest('로그아웃 실패 시 팝오버 밖 오류 배너를 유지한다', async ({ page, account }) => {
  await page.route('**/api/auth/logout', (route) =>
    route.fulfill({
      status: 500,
      body: '',
    }),
  )

  await page.goto('/')
  const currentUrl = page.url()

  await accountMenu(page, account).click()
  await page.getByRole('button', { name: '로그아웃' }).click()

  // Next의 라우트 announcer(#__next-route-announcer__)도 role="alert"이라 이름으로 좁힌다.
  const alert = page.getByRole('alert', { name: '로그아웃 오류' })
  await expect(alert).toContainText('로그아웃에 실패했습니다. 다시 시도해 주세요.')
  expect(page.url()).toBe(currentUrl)

  // 배너가 헤더를 덮으므로 트리거를 다시 누르는 대신 Escape로 팝오버를 닫는다.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: '계정 메뉴' })).toHaveCount(0)
  await expect(alert).toBeVisible()

  await page.getByRole('button', { name: '로그아웃 오류 닫기' }).click()
  await expect(alert).toHaveCount(0)
})
