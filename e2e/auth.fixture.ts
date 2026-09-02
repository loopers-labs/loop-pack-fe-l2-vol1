import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// eslint-disable-next-line import-x/no-extraneous-dependencies -- Playwright fixture는 E2E 테스트 인프라다.
import { expect, test as base, type Page } from '@playwright/test';

type TestAccount = {
  email: string;
  name: string;
  password: string;
};

const ACCOUNT_COUNT = 8;
const TEST_PASSWORD = 'looper1234';

export function getTestAccount(index: number): TestAccount {
  if (index < 0 || index >= ACCOUNT_COUNT) {
    throw new Error(`E2E 계정은 ${ACCOUNT_COUNT}개까지 사용할 수 있습니다.`);
  }

  const number = index + 1;

  return {
    email: `looper${number}@loopers.dev`,
    name: `루퍼${number}`,
    password: TEST_PASSWORD,
  };
}

export async function submitLoginForm(page: Page, account: TestAccount) {
  await page.getByLabel('이메일').fill(account.email);
  await page.getByLabel('비밀번호').fill(account.password);
  await page.getByRole('button', { name: '로그인' }).click();
}

type WorkerFixtures = {
  workerStorageState: string;
};

type TestFixtures = Record<never, never>;

export const test = base.extend<TestFixtures, WorkerFixtures>({
  storageState: ({ workerStorageState }, provideStorageState) =>
    provideStorageState(workerStorageState),
  workerStorageState: [
    async ({ browser }, provideStorageState, workerInfo) => {
      const account = getTestAccount(workerInfo.parallelIndex);
      const baseURL = workerInfo.project.use.baseURL;
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL이 필요합니다.');
      }

      const authDirectory = path.join(workerInfo.project.outputDir, '.auth');
      const authFile = path.join(
        authDirectory,
        `worker-${workerInfo.parallelIndex}.json`,
      );
      await mkdir(authDirectory, { recursive: true });

      const page = await browser.newPage({ baseURL });
      await page.goto('/login');
      await submitLoginForm(page, account);
      await expect(
        page.getByRole('link', { name: account.name }),
      ).toBeVisible();
      await page.context().storageState({ path: authFile });
      await page.close();

      await provideStorageState(authFile);
    },
    { scope: 'worker' },
  ],
});

export { expect };
