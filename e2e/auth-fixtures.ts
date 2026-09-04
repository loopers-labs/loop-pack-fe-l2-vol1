import { expect, test as base } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// 스타터가 주는 계정 수(looper1~looper8). 워커 격리의 상한이라 매직넘버로 흩어두지 않는다.
const ACCOUNT_COUNT = 8;

// 로그인 1회를 워커 단위로 재사용하는 test. 로그인 폼을 매 테스트에서 다시 채우지 않는다.
//
// 병렬 격리는 계정을 워커별로 갈라 확보한다 — 워커(parallelIndex)마다 looper{n} 계정을 쓰고,
// storageState도 워커별 파일로 저장해 서로 섞이지 않는다(주문은 서버에 유저별로 쌓이므로 계정을 나눠야 격리된다).
// 계정이 ACCOUNT_COUNT개인 이유가 여기다: 그 수만큼의 워커까지 각자 다른 계정을 잡는다.
export const test = base.extend<object, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),
  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      const id = workerInfo.parallelIndex;
      // 워커가 계정 수를 넘으면 없는 계정(looper9~)으로 로그인해 "로그아웃 버튼 안 뜸"
      // 타임아웃이라는 엉뚱한 실패로 죽는다. 원인을 바로 아는 메시지로 먼저 끊는다.
      if (id >= ACCOUNT_COUNT) {
        throw new Error(
          `워커 ${id}에 배정할 계정이 없다(계정은 looper1~looper${ACCOUNT_COUNT}). --workers를 ${ACCOUNT_COUNT} 이하로 돌려라.`,
        );
      }
      const file = path.resolve(workerInfo.project.outputDir, `.auth/worker-${id}.json`);
      if (fs.existsSync(file)) {
        await use(file);
        return;
      }
      // browser.newPage는 config의 baseURL을 안 물려받으므로 명시한다(상대경로 goto가 유효해지게).
      const page = await browser.newPage({
        storageState: undefined,
        baseURL: workerInfo.project.use.baseURL,
      });
      await page.goto("/login");
      await page.getByLabel("이메일").fill(`looper${id + 1}@loopers.dev`);
      await page.getByLabel("비밀번호").fill("looper1234");
      await page.getByRole("button", { name: "로그인" }).click();
      // 로그인 성공은 헤더에 로그아웃 버튼이 뜨는 것으로 확인한다(sleep 없이 조건 대기).
      await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
      await page.context().storageState({ path: file });
      await page.close();
      await use(file);
    },
    { scope: "worker" },
  ],
});

export { expect };
