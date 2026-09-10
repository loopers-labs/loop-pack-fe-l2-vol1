// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // 워커별 계정(looper1~8)으로 격리하므로 파일 안의 테스트도 병렬로 돈다.
  // CI 러너는 코어가 적고 mock API 가 요청마다 500ms 를 쉬므로 2개, 로컬은 4개(완료조건 --workers=4 는 CLI 로 강제)
  fullyParallel: true,
  workers: isCI ? 2 : 4,
  retries: 0,
  forbidOnly: isCI,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    // 실패한 테스트만 trace 를 남긴다. 읽는 법은 PR 본문의 trace 기록 참고
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    // 8주차엔 로컬에서 기존 서버를 재사용했다. 3000 에 `next dev` 가 떠 있으면 dev 빌드 위에서 조용히 돌게 되므로
    // 항상 production 서버를 직접 띄운다 — 포트가 점유돼 있으면 재사용 대신 실패한다
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
