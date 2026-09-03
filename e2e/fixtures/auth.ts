import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const TEST_PASSWORD = 'looper1234';
const SCENARIO_ACCOUNT_OFFSET = 1;
const AUTH_ACCOUNT_OFFSET = 5;
const AUTH_ACCOUNT_COUNT = 4;

type Account = {
  email: string;
  name: string;
};

type WorkerAuth = {
  account: Account;
  storageStatePath: string;
};

type ScenarioWorkerFixtures = {
  workerAccount: Account;
};

type WorkerFixtures = {
  workerAuth: WorkerAuth;
};

function accountFor(offset: number, parallelIndex: number): Account {
  const accountNumber = offset + (parallelIndex % AUTH_ACCOUNT_COUNT);
  return {
    email: `looper${accountNumber}@loopers.dev`,
    name: `루퍼${accountNumber}`,
  };
}

export const test = base.extend<object, ScenarioWorkerFixtures>({
  workerAccount: [
    async ({ browserName }, provide, workerInfo) => {
      void browserName;
      await provide(accountFor(SCENARIO_ACCOUNT_OFFSET, workerInfo.parallelIndex));
    },
    { scope: 'worker' },
  ],
});

export const authenticatedTest = test.extend<object, WorkerFixtures>({
  workerAuth: [
    async ({ browser }, provide, workerInfo) => {
      const account = accountFor(AUTH_ACCOUNT_OFFSET, workerInfo.parallelIndex);
      const baseURL = workerInfo.project.use.baseURL;

      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL이 필요합니다.');
      }

      const storageStatePath = path.join(
        workerInfo.project.outputDir,
        '.auth',
        `${workerInfo.project.name}-worker-${workerInfo.parallelIndex}.json`,
      );
      await mkdir(path.dirname(storageStatePath), { recursive: true });

      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      const loginPage = new LoginPage(page);

      await page.goto('/login');
      await loginPage.submit(account.email, TEST_PASSWORD);
      await expect(page.getByText(`${account.name}님`, { exact: true })).toBeVisible();
      await context.storageState({ path: storageStatePath });
      await context.close();

      await provide({ account, storageStatePath });
    },
    { scope: 'worker' },
  ],
  storageState: async ({ workerAuth }, provide) => {
    await provide(workerAuth.storageStatePath);
  },
});

export { expect };
