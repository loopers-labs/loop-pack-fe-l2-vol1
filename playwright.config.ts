import { defineConfig, devices } from "@playwright/test";

const baseURL = `http://localhost:${process.env.PORT ?? "3000"}`;
const isCI = process.env.CI !== undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // production build 위에서만 돈다. 개발 서버에서만 통과하는 건 인정되지 않고,
  // mock API의 500ms 고정 지연도 production에서만 나타난다(그걸 그대로 만나야 한다).
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
