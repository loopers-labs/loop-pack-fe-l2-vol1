// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // 워커별 계정(looper1~8)으로 격리하므로 파일 안의 테스트도 병렬로 돈다
  fullyParallel: true,
  workers: 4,
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
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
