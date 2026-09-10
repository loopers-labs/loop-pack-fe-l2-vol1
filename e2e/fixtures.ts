import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { expect, test as base } from '@playwright/test'

interface Account {
  name: string
  email: string
  password: string
}

interface WorkerFixtures {
  account: Account
  workerStorageState: string
}

const accounts = Array.from({ length: 8 }, (_, index) => ({
  name: `루퍼${index + 1}`,
  email: `looper${index + 1}@loopers.dev`,
  password: 'looper1234',
}))

export const test = base.extend<object, WorkerFixtures>({
  account: [
    async ({ playwright: _playwright }, applyAccount, workerInfo) => {
      const account = accounts[workerInfo.parallelIndex]
      if (account === undefined) {
        throw new Error(
          `워커 ${workerInfo.parallelIndex}에 배정할 계정이 없습니다. workers를 ${accounts.length} 이하로 둡니다.`,
        )
      }
      await applyAccount(account)
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ browser, account }, applyStorageState, workerInfo) => {
      const authDir = path.join(workerInfo.project.outputDir, '.auth')
      const stateFile = path.join(
        authDir,
        `worker-${workerInfo.parallelIndex}.json`,
      )
      await mkdir(authDir, { recursive: true })

      // 워커마다 실제 로그인 UI를 한 번 지나고, 그 워커의 테스트가 쿠키를 재사용한다.
      // API로 쿠키를 위조하면 로그인 흐름과 브라우저의 Set-Cookie 해석을 건너뛴다.
      const page = await browser.newPage({
        baseURL: workerInfo.project.use.baseURL as string,
        storageState: undefined,
      })
      await page.goto('/login')
      await page.getByLabel('이메일').fill(account.email)
      await page.getByLabel('비밀번호').fill(account.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible()
      await page.context().storageState({ path: stateFile })
      await page.close()

      await applyStorageState(stateFile)
    },
    { scope: 'worker' },
  ],

  storageState: async ({ workerStorageState }, applyStorageState) => {
    await applyStorageState(workerStorageState)
  },
})

export { expect } from '@playwright/test'

// 로그인 자체를 검증하는 테스트다. 계정 배정 규칙은 공유하되 저장 상태만 비운다.
// 인증된 fixture를 쓰면 로그인 폼과 Set-Cookie가 깨져도 이미 로그인된 채 통과한다.
export const anonymousTest = test.extend({
  storageState: async ({ account: _account }, applyStorageState) => {
    await applyStorageState({ cookies: [], origins: [] })
  },
})
