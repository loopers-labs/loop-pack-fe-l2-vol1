import { expect, test } from '@playwright/test'

import { TEST_PASSWORD } from '@/app/api/_data/auth'
import { SESSION_COOKIE } from '@/app/api/_data/auth-cookies'

import {
  expiredSessionCookie,
  signIn,
  trackedEvent,
  trackedEventNames,
  workerAccount,
} from './support/auth'

const productName = 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502'

test('Protected checkout - when an anonymous shopper with a cart opens checkout - restores the path and the cart after login', async ({
  page,
}, testInfo) => {
  // Arrange
  const account = workerAccount(testInfo.workerIndex)
  await page.goto('/products')
  await page.getByRole('button', { name: `${productName} 장바구니` }).click()
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()

  // Act
  await page.goto('/checkout')
  await expect(page).toHaveURL('/login?next=%2Fcheckout')
  await signIn(page, account.email)

  // Assert
  await page.waitForURL('/checkout')
  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
  await expect(page.getByLabel('장바구니 1개')).toBeVisible()
  await expect(page.getByText('수량 1')).toBeVisible()
})

test('Expired session - when a shopper with an expired token opens checkout - explains the expiry and restores the path after signing in again', async ({
  page,
  context,
}, testInfo) => {
  // Arrange
  const account = workerAccount(testInfo.workerIndex)
  await context.addCookies([expiredSessionCookie(account.id)])

  // Act
  await page.goto('/checkout')

  // Assert
  await expect(page).toHaveURL('/login?next=%2Fcheckout&reason=expired')
  await expect(
    page.getByRole('status').filter({ hasText: '세션이 만료되었습니다.' }),
  ).toBeVisible()
  await expect
    .poll(async () => trackedEvent(page, 'login_start'))
    .toMatchObject({ from: 'expired' })

  // Act
  await signIn(page, account.email)

  // Assert
  await page.waitForURL('/checkout')
  await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
})

test('Invalid credentials - when a shopper submits a wrong password - keeps the form without a session', async ({
  page,
  context,
}, testInfo) => {
  // Arrange
  const account = workerAccount(testInfo.workerIndex)
  await page.goto('/login')

  // Act
  await signIn(page, account.email, `${TEST_PASSWORD}-wrong`)

  // Assert
  await expect(
    page.getByText('이메일 또는 비밀번호를 확인해주세요.'),
  ).toBeVisible()
  await expect(page).toHaveURL('/login')
  await expect
    .poll(async () => trackedEvent(page, 'login_fail'))
    .toMatchObject({ reason: 'invalid_credentials' })
  expect(await trackedEventNames(page)).not.toContain('login_success')
  const cookies = await context.cookies()
  expect(cookies.filter((cookie) => cookie.name === SESSION_COOKIE)).toEqual([])
})
