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
      const baseURL = workerInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL이 필요하다.')
      }

      const context = await browser.newContext()
      const storageState = await (async () => {
        try {
          const page = await context.newPage()
          await page.goto(new URL('/login', baseURL).toString())
          await signIn(page, account.email)
          await page.waitForURL(new URL('/', baseURL).toString())
          return await context.storageState()
        } finally {
          await context.close()
        }
      })()

      await runFixture(storageState)
    },
    { scope: 'worker' },
  ],
  storageState: async ({ authenticatedStorageState }, runFixture) => {
    await runFixture(authenticatedStorageState)
  },
})
