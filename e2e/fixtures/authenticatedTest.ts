import { expect, test as base } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

interface TestAccount {
  id: string;
  email: string;
}

interface AuthenticatedTestFixtures {
  account: TestAccount;
}

interface AuthenticatedWorkerFixtures {
  authenticatedWorker: {
    account: TestAccount;
    storageState: Awaited<ReturnType<BrowserContext['storageState']>>;
  };
}

const TEST_PASSWORD = 'looper1234';
const TEST_ACCOUNTS: TestAccount[] = Array.from({ length: 8 }, (_, index) => ({
  id: `u${index + 1}`,
  email: `looper${index + 1}@loopers.dev`,
}));

export const test = base.extend<
  AuthenticatedTestFixtures,
  AuthenticatedWorkerFixtures
>({
  authenticatedWorker: [
    async ({ browser }, provide, workerInfo) => {
      const account =
        TEST_ACCOUNTS[workerInfo.parallelIndex % TEST_ACCOUNTS.length];
      const baseURL = workerInfo.project.use.baseURL;
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL이 필요합니다.');
      }

      const context = await browser.newContext({ baseURL });
      const response = await context.request.post('/api/auth/login', {
        data: { email: account.email, password: TEST_PASSWORD },
      });

      if (!response.ok()) {
        await context.close();
        throw new Error(`${account.email} 테스트 계정 로그인에 실패했습니다.`);
      }

      const storageState = await context.storageState();
      await context.close();
      await provide({ account, storageState });
    },
    { scope: 'worker' },
  ],
  account: async ({ authenticatedWorker }, provide) => {
    await provide(authenticatedWorker.account);
  },
  storageState: async ({ authenticatedWorker }, provide) => {
    await provide(authenticatedWorker.storageState);
  },
});

export { expect };
