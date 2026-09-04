import { test as setup, expect } from '@playwright/test'
import { TEST_PASSWORD } from '@/entities/session/server'
import { getAuthStatePath, getWorkerAccount } from './accounts'

for (const accountIndex of [0, 1, 2, 3]) {
  setup(`worker ${accountIndex} 인증 상태 생성`, async ({ page }) => {
    const account = getWorkerAccount(accountIndex)

    await page.goto('/login')
    await page.getByLabel('이메일').fill(account.email)
    await page.getByLabel('비밀번호').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: '로그인', exact: true }).click()

    await expect(
      page.getByRole('button', { name: '로그아웃', exact: true }),
    ).toBeVisible()
    await page.context().storageState({ path: getAuthStatePath(accountIndex) })
  })
}
