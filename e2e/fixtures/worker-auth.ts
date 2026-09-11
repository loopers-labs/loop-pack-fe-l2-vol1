import { expect, test as base } from '@playwright/test'
import path from 'node:path'
import { accountMenu, submitLogin } from './login-actions'
import { accountForSlot, type TestAccount } from './test-accounts'

type WorkerFixtures = {
  account: TestAccount
  workerStorageState: string
}

const AUTH_STATE_DIR = path.join(process.cwd(), 'playwright/.auth')

// 워커마다 계정 하나와 storageState 파일 하나를 갖는다. 로그인은 워커당 한 번이고
// 그 워커의 테스트들이 그 파일을 재사용한다.
// 로그인 자체를 검증하는 테스트는 이 test를 쓰지 않는다 — 검증 대상을 건너뛰고 시작하게 된다.
export const test = base.extend<object, WorkerFixtures>({
  account: [
    // Playwright가 첫 인자에 구조 분해 패턴을 요구한다. 이 fixture는 다른 fixture를 쓰지 않는다.
    async ({}, use, workerInfo) => {
      await use(accountForSlot(workerInfo.parallelIndex))
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ browser, account }, use, workerInfo) => {
      const statePath = path.join(AUTH_STATE_DIR, `worker-${workerInfo.parallelIndex}.json`)
      // 이 fixture는 테스트가 시작되기 전에 돈다. 그 시점의 browser.newContext()에는
      // config의 use 옵션이 적용되지 않으므로 baseURL을 직접 넘긴다.
      const context = await browser.newContext({
        baseURL: workerInfo.project.use.baseURL,
        storageState: undefined,
      })
      const page = await context.newPage()

      await page.goto('/login')
      await submitLogin(page, account)
      // 헤더가 로그인 상태로 바뀐 뒤 저장한다. 쿠키만 보고 저장하면 세션이 붙기 전 상태가 남는다.
      await expect(accountMenu(page, account)).toBeVisible()

      await context.storageState({ path: statePath })
      await context.close()

      await use(statePath)
    },
    { scope: 'worker' },
  ],

  // 워커 파일을 그 워커의 모든 테스트에 기본 storageState로 준다.
  storageState: [
    async ({ workerStorageState }, use) => {
      await use(workerStorageState)
    },
    { scope: 'test' },
  ],
})

export { expect } from '@playwright/test'
