import path from "node:path";
import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
};

const ACCOUNT_COUNT = 8;
const PASSWORD = "looper1234";

// 워커 하나가 계정 하나를 독점한다. 주문 저장소가 계정별로 나뉘어 있어 워커가 4개든 1개든 서로의 데이터를
// 보지 못하고, 저장 파일도 워커별로 갈라 storageState 가 섞이지 않는다. 계정이 8개라 워커도 8개까지다
export const accountForWorker = (parallelIndex: number): Account => {
  if (parallelIndex >= ACCOUNT_COUNT) {
    throw new Error(
      `테스트 계정은 ${ACCOUNT_COUNT}개다. --workers 를 ${ACCOUNT_COUNT} 이하로 줄여라`,
    );
  }
  const n = parallelIndex + 1;
  return { id: `u${n}`, name: `루퍼${n}`, email: `looper${n}@loopers.dev`, password: PASSWORD };
};

type WorkerFixtures = {
  account: Account;
  workerStorageState: string;
};

export const test = base.extend<Record<never, never>, WorkerFixtures>({
  account: [
    // Playwright 는 픽스처 함수의 첫 인자가 객체 구조 분해여야 의존성을 읽는다 — 의존성이 없어도 `{}` 가 필요하다
    // https://playwright.dev/docs/test-fixtures#creating-a-fixture
    // eslint-disable-next-line no-empty-pattern
    async ({}, provide, workerInfo) => {
      await provide(accountForWorker(workerInfo.parallelIndex));
    },
    { scope: "worker" },
  ],

  // 워커당 로그인 1회. 실제 로그인 폼을 지나서 저장한다 — API 를 직접 불러 쿠키를 심으면
  // 로그인 폼이 깨져도 storageState 를 쓰는 테스트가 전부 초록이 된다.
  // 세션 TTL 이 1시간이라 파일은 실행마다 새로 만든다(디스크 재사용 없음)
  workerStorageState: [
    async ({ browser, account }, provide, workerInfo) => {
      const fileName = path.join(
        workerInfo.project.outputDir,
        `.auth/worker-${workerInfo.parallelIndex}.json`,
      );
      const page = await browser.newPage({
        baseURL: workerInfo.project.use.baseURL,
        storageState: undefined,
      });
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(account.email, account.password);
      await expect(page).toHaveURL("/");
      await expect(page.getByText(`${account.name}님`)).toBeVisible();
      await page.context().storageState({ path: fileName });
      await page.close();
      await provide(fileName);
    },
    { scope: "worker" },
  ],

  storageState: ({ workerStorageState }, provide) => provide(workerStorageState),
});

export { expect };
