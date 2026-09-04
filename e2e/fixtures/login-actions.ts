import type { Page } from '@playwright/test'
import { TEST_PASSWORD, type TestAccount } from './test-accounts'

// 로그인 화면의 폼을 채운다. 로그인 상태를 API 호출로 위조하지 않는다 —
// storageState도 이 경로를 한 번 통과해 만든 것이다.
export const submitLogin = async (
  page: Page,
  account: TestAccount,
  password: string = TEST_PASSWORD,
): Promise<void> => {
  await page.getByLabel('이메일').fill(account.email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
}

export const accountMenu = (page: Page, account: TestAccount) =>
  page.getByRole('button', { name: `${account.name} 계정 메뉴` })
