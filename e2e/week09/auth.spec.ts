import type { Page, Response } from '@playwright/test'
import { TEST_PASSWORD } from '@/entities/session/server'
import { expect, test } from './fixtures'

const BASE_URL = 'http://localhost:3109'

function waitForApiResponse(
  page: Page,
  pathname: string,
  method: string,
  status: number,
): Promise<Response> {
  return page.waitForResponse((response) => {
    const request = response.request()

    return (
      new URL(response.url()).pathname === pathname &&
      request.method() === method &&
      response.status() === status
    )
  })
}

async function submitLogin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
}

test('미로그인 사용자가 로그인하면 query를 포함한 보호 경로로 돌아간다', async ({
  page,
  workerAccount,
}) => {
  await page.goto('/checkout?coupon=welcome')

  await expect(page).toHaveURL(
    `${BASE_URL}/login?returnTo=%2Fcheckout%3Fcoupon%3Dwelcome`,
  )
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()

  const loginResponse = waitForApiResponse(page, '/api/auth/login', 'POST', 200)
  await submitLogin(page, workerAccount.email, TEST_PASSWORD)
  await loginResponse

  await expect(page).toHaveURL(`${BASE_URL}/checkout?coupon=welcome`)
  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
})

test('만료된 세션은 주문 API의 401 뒤 만료 안내가 있는 로그인 화면으로 이동한다', async ({
  authenticatedPage,
}) => {
  await authenticatedPage.context().addCookies([
    {
      name: 'scenario',
      value: 'expired',
      url: BASE_URL,
    },
  ])
  const expiredResponse = waitForApiResponse(
    authenticatedPage,
    '/api/orders',
    'GET',
    401,
  )

  await authenticatedPage.goto('/orders')
  await expiredResponse

  await expect(authenticatedPage).toHaveURL(
    `${BASE_URL}/login?reason=expired&returnTo=%2Forders`,
  )
  await expect(
    authenticatedPage
      .getByRole('status')
      .filter({ hasText: '세션이 만료되었습니다. 다시 로그인해주세요.' }),
  ).toBeVisible()
})

test('잘못된 비밀번호는 오류를 알리고 로그인 화면에 머문다', async ({
  page,
  workerAccount,
}) => {
  await page.goto('/login?returnTo=%2Forders')
  const loginResponse = waitForApiResponse(page, '/api/auth/login', 'POST', 401)

  await submitLogin(page, workerAccount.email, 'wrong-password')
  await loginResponse

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '이메일 또는 비밀번호를 확인해주세요.' }),
  ).toBeVisible()
  await expect(page).toHaveURL(`${BASE_URL}/login?returnTo=%2Forders`)
})
