import { anonymousTest as test, expect } from './fixtures'

const login = async (
  page: import('@playwright/test').Page,
  account: { email: string; password: string },
) => {
  await page.getByLabel('이메일').fill(account.email)
  await page.getByLabel('비밀번호').fill(account.password)
  await page.getByRole('button', { name: '로그인' }).click()
}

test.describe('인증 흐름', () => {
  test('미로그인 주문서 진입은 로그인 후 원래 경로를 복원한다', async ({
    page,
    account,
  }) => {
    await page.goto('/orders/new')

    await expect(page).toHaveURL(/\/login\?next=%2Forders%2Fnew$/)
    await login(page, account)

    await expect(page).toHaveURL('/orders/new')
    const sessionCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'session',
    )
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie).toMatchObject({
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    })
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
    await expect(page.getByText(`${account.name}님`)).toBeVisible()
  })

  test('로그아웃 상태에서 보호 링크를 먼저 보아도 로그인 후 경로를 복원한다', async ({
    page,
    account,
  }) => {
    await page.goto('/products')

    const bagLink = page.getByRole('link', { name: /^Bag \d+$/ })
    await bagLink.hover()
    await bagLink.click()

    await expect(page).toHaveURL(/\/login\?next=%2Forders%2Fnew$/)
    await login(page, account)

    await expect(page).toHaveURL('/orders/new')
    await expect(page.getByRole('heading', { name: '주문서' })).toBeVisible()
  })

  test('잘못된 자격 증명은 오류를 보여주고 로그인 화면에 머문다', async ({
    page,
    account,
  }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(account.email)
    await page.getByLabel('비밀번호').fill('wrong-password')
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: '이메일 또는 비밀번호를 확인해주세요.' }),
    ).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})
