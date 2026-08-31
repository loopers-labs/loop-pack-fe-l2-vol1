import { test as base, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { TEST_PASSWORD } from "@/app/api/_data/auth";

// 워커별 계정으로 로그인해 storageState 를 재사용하는 fixture.
//
// storageState: 워커당 로그인 1회 → 파일로 저장해 그 워커의 모든 테스트가 재사용한다(매 테스트 폼 재입력 X).
// 저장 파일도 워커별로 나눠 계정 격리를 그대로 유지한다.

const AUTH_STATE_DIR = path.join(__dirname, "..", ".auth");

export const test = base.extend<object, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({ browser }, use) => {
      const workerIndex = test.info().parallelIndex;
      const email = `looper${workerIndex + 1}@loopers.dev`;
      const stateFile = path.join(AUTH_STATE_DIR, `worker-${workerIndex}.json`);

      // 같은 워커에서 이미 로그인해 둔 상태가 있으면 그대로 재사용한다.
      if (fs.existsSync(stateFile)) {
        await use(stateFile);

        return;
      }

      fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
      // browser.newPage 는 프로젝트 use 를 상속하지 않아 baseURL 을 직접 넘긴다(상대경로 goto 용).
      const page = await browser.newPage({
        storageState: undefined,
        baseURL: test.info().project.use.baseURL,
      });
      await page.goto("/login");
      await page.getByLabel("이메일").fill(email);
      await page.getByLabel("비밀번호").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "로그인" }).click();

      // 로그인 성공 신호(로그아웃 버튼 노출)를 조건 대기 — sleep 없이 세션 확정까지 기다린다.
      await expect(
        page.getByRole("button", { name: "로그아웃" }),
      ).toBeVisible();
      await page.context().storageState({ path: stateFile });
      await page.close();

      await use(stateFile);
    },
    { scope: "worker" },
  ],
});

export { expect };
