import { defineConfig } from "@playwright/test";

const CI_RETRY_COUNT = 2;
const WEB_SERVER_TIMEOUT_MS = 120_000;
const DEV_PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? CI_RETRY_COUNT : 0,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    trace: "on-first-retry",
  },
  // production build 위에서 실행 (개발 서버 아님)
  webServer: {
    command: "pnpm build && pnpm start",
    url: `http://localhost:${DEV_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: WEB_SERVER_TIMEOUT_MS,
  },
});