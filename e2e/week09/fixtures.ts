import { test as base, expect, type Page } from '@playwright/test'
import type { AuthUser } from '@/entities/session'
import { getAuthStatePath, getWorkerAccount } from './accounts'

interface Week09Fixtures {
  authenticatedPage: Page
  workerAccount: AuthUser
}

export const test = base.extend<Week09Fixtures>({
  workerAccount: async ({}, provide, testInfo) => {
    await provide(getWorkerAccount(testInfo.parallelIndex))
  },
  authenticatedPage: async ({ baseURL, browser }, provide, testInfo) => {
    const context = await browser.newContext({
      baseURL,
      storageState: getAuthStatePath(testInfo.parallelIndex),
    })
    const page = await context.newPage()

    await provide(page)
    await context.close()
  },
})

export { expect }
