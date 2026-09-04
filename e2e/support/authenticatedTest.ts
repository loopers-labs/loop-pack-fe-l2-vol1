import type { BrowserContext } from '@playwright/test'
import { test as base } from '@playwright/test'

import { parallelAccount, signIn } from './auth'

type AuthenticatedWorkerFixtures = {
  readonly authenticatedStorageState: Awaited<
    ReturnType<BrowserContext['storageState']>
  >
}

export const test = base.extend<
  Record<never, never>,
  AuthenticatedWorkerFixtures
>({
  authenticatedStorageState: [
    async ({ browser }, runFixture, workerInfo) => {
      const account = parallelAccount(workerInfo.parallelIndex)
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto('http://localhost:3000/login')
      await signIn(page, account.email)
      await page.waitForURL('http://localhost:3000/')
      const storageState = await context.storageState()
      await context.close()

      await runFixture(storageState)
    },
    { scope: 'worker' },
  ],
  storageState: async ({ authenticatedStorageState }, runFixture) => {
    await runFixture(authenticatedStorageState)
  },
})
