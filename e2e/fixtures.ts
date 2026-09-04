import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect } from '@playwright/test';
import { APP_ORIGIN } from '../playwright.config';

// playwright.dev/docs/auth "Authenticate in a worker fixture" 레시피 그대로.
// 계정 자체가 서버 상태를 나눠 갖지 않으므로(이번 주 테스트는 주문을 만들지 않는다)
// account를 나누는 목적은 데이터 충돌이 아니라 워커끼리 같은 세션을 밟지 않게 하는 것이다.
export const test = base.extend<object, { account: { email: string; password: string }; workerStorageState: string }>({
  account: [({}, provide, { parallelIndex }) => provide({ email: `looper${(parallelIndex % 8) + 1}@loopers.dev`, password: 'looper1234' }), { scope: 'worker' }],

  workerStorageState: [
    async ({ browser, account }, provide) => {
      const id = test.info().parallelIndex;
      const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

      if (fs.existsSync(fileName)) {
        await provide(fileName);
        return;
      }

      // 깨끗한 환경에서 인증한다. baseURL은 테스트 스코프 옵션이라 worker 스코프
      // 픽스처에서 못 받으므로 config의 origin 상수를 그대로 쓴다.
      const page = await browser.newPage({ baseURL: APP_ORIGIN, storageState: undefined });
      await page.goto('/login');
      await page.getByLabel('이메일').fill(account.email);
      await page.getByLabel('비밀번호').fill(account.password);
      await page.getByRole('button', { name: '로그인' }).click();
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
      await page.context().storageState({ path: fileName });
      await page.close();

      await provide(fileName);
    },
    { scope: 'worker' }
  ],

  storageState: ({ workerStorageState }, provide) => provide(workerStorageState)
});

export { expect };
