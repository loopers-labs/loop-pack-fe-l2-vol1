import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as base } from '@playwright/test';
import { BASE_URL } from './base-url';
import { loginAs } from './pom/login';

// 격리 설계 (RFC C절 → 4단계): 계정 = 워커.
// 스타터 계정 8개(looper1~8)를 parallelIndex로 배분한다. 주문은 서버 메모리에 userId별로 쌓이므로
// 계정을 가르면 데이터도 갈린다 — 워커 4개가 같은 계정으로 주문하면 "+1" 단언이 서로 밟는다.
export type Account = { email: string; password: string; name: string };

const accounts: Account[] = Array.from({ length: 8 }, (_, index) => ({
  email: `looper${index + 1}@loopers.dev`,
  password: 'looper1234',
  name: `루퍼${index + 1}`,
}));

const AUTH_DIR = path.resolve(__dirname, '.auth');

type WorkerFixtures = {
  account: Account;
  workerStorageState: string;
};

// storageState는 워커별 파일로 나눈다(과제 힌트). setup 프로젝트 하나로 만들면 파일이 "테스트당 1개"라
// 워커 수와 맞지 않는다 — Playwright 문서의 "one account per parallel worker" 패턴(worker fixture)을 쓴다.
// 로그인은 **폼으로** 1회 한다 — API 직접 호출로 쿠키를 위조하지 않는다(과제 "하지 말 것").
// fixture 콜백의 두 번째 인자는 Playwright가 `use`라 부르지만, React 19 `use` 훅과 이름이 겹쳐
// react-hooks/rules-of-hooks가 오탐한다. 이름은 자유라 `provide`로 받는다.
export const test = base.extend<object, WorkerFixtures>({
  account: [
    async ({}, provide, { parallelIndex }) => {
      await provide(accounts[parallelIndex % accounts.length]);
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ browser, account }, provide, { parallelIndex }) => {
      mkdirSync(AUTH_DIR, { recursive: true });
      const file = path.join(AUTH_DIR, `worker-${parallelIndex}.json`);

      // 빈 storageState로 시작해야 한다 — 이 fixture가 다른 워커의 파일을 물려받으면 안 된다.
      // browser.newPage()는 config의 use 옵션을 물려받지 않고, worker fixture는 테스트 스코프
      // 옵션인 baseURL을 받을 수 없다 — 상수(e2e/base-url.ts)를 직접 넘긴다.
      const page = await browser.newPage({
        baseURL: BASE_URL,
        storageState: undefined,
      });
      await loginAs(page, account);
      await page.context().storageState({ path: file });
      await page.close();

      await provide(file);
    },
    { scope: 'worker' },
  ],

  // 이 test를 쓰는 테스트는 기본으로 로그인된 상태다.
  // 로그인 자체를 검증하는 테스트는 test.use({ storageState: { cookies: [], origins: [] } })로 비운다.
  storageState: async ({ workerStorageState }, provide) => {
    await provide(workerStorageState);
  },
});

export { expect } from '@playwright/test';
