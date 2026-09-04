import { test as base, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { accountFor, TEST_PASSWORD_VALUE } from "./accounts";

const AUTH_DIR = path.resolve(process.cwd(), "playwright/.auth");

type WorkerFixtures = {
  /** 이 워커의 로그인 상태 파일 경로. */
  workerStorageState: string;
};

// Playwright fixture의 두 번째 인자는 관례상 `use`인데, 이 레포의
// react-hooks/rules-of-hooks가 그것을 React 19의 `use` 훅 호출로 읽는다
// (훅은 컴포넌트나 use* 함수 안에서만 불릴 수 있다는 규칙에 걸린다).
// 룰을 끄지 않고 이름을 바꿨다 — 위치 인자라 이름은 계약이 아니다.
//
// ── storageState를 워커별로 나눈다 ──────────────────────────────────────────
// 로그인은 워커당 한 번이다. 매 테스트에서 폼을 다시 채우면 테스트마다 1.5초를
// 더 쓴다.
//
// 파일 하나를 공유하면 안 된다. 워커마다 계정이 다르므로 저장된 쿠키도 달라야 하고,
// 한 파일에 쓰면 마지막에 쓴 워커의 세션으로 전부 덮인다. parallelIndex를 파일명에
// 넣는다.
export const test = base.extend<object, WorkerFixtures>({
  workerStorageState: [
    async ({ browser }, provide, workerInfo) => {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      const file = path.join(AUTH_DIR, `worker-${workerInfo.parallelIndex}.json`);
      const account = accountFor(workerInfo.parallelIndex);

      // 로그인은 API로 한다. 이 상태는 **인증을 검증하지 않는 테스트**의 출발점일
      // 뿐이고, 인증 플로우 자체는 storageState를 쓰지 않고 실제 폼을 지나간다.
      // 여기서 UI 로그인을 돌리면 검증하지도 않을 화면을 워커마다 한 번 더 그린다.
      // newContext는 test-scoped인 baseURL을 물려받지 않는다(worker fixture는
      // test-scoped fixture에 의존할 수 없다). 프로젝트 설정에서 직접 읽는다.
      const baseURL = workerInfo.project.use.baseURL;
      if (baseURL === undefined) {
        throw new Error("baseURL이 없습니다 — playwright.config.ts를 확인하세요.");
      }
      const context = await browser.newContext({ baseURL });
      const response = await context.request.post("/api/auth/login", {
        data: { email: account.email, password: TEST_PASSWORD_VALUE },
      });
      if (!response.ok()) {
        throw new Error(`워커 ${workerInfo.parallelIndex} 로그인 실패: ${response.status()}`);
      }
      await context.storageState({ path: file });
      await context.close();

      await provide(file);
    },
    { scope: "worker" },
  ],
});

export const expect = test.expect;

/** 로그인 상태로 도는 테스트. */
export const authed = test.extend({
  storageState: ({ workerStorageState }, provide) => provide(workerStorageState),
});

// 계정을 fixture로 두지 않는다. fixture의 첫 인자는 구조분해여야 하는데(Playwright)
// 이 fixture는 다른 fixture가 필요 없어 `{}`가 되고, 그건 no-empty-pattern에 걸린다.
// 계정은 워커 슬롯 번호에서 바로 나오는 값이라 헬퍼로 충분하다.
export const currentAccount = () => accountFor(test.info().parallelIndex);

/** 시나리오 노브를 쿠키로 건다 — 앱 안에서 /api/auth/me에는 query를 붙일 수 없다. */
export async function setScenario(page: Page, scenario: "invalid" | "expired" | "error" | "slow") {
  await page
    .context()
    .addCookies([
      { name: "scenario", value: scenario, url: page.url() || "http://localhost:3000" },
    ]);
}
