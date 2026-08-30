import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI === "true";
const port = process.env.PORT ?? "3000";
const mockApiPort = process.env.MOCK_API_PORT ?? "4010";
const baseURL = `http://127.0.0.1:${port}`;
const mockApiBaseURL = `http://127.0.0.1:${mockApiPort}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/mock-api/*.test.mjs"],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup auth",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup auth"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `MOCK_API_PORT=${mockApiPort} node e2e/mock-api/server.mjs`,
      url: `${mockApiBaseURL}/__test__/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `INTERNAL_API_BASE_URL=${mockApiBaseURL} NEXT_PUBLIC_API_BASE_URL=${mockApiBaseURL} pnpm build && INTERNAL_API_BASE_URL=${mockApiBaseURL} NEXT_PUBLIC_API_BASE_URL=${mockApiBaseURL} pnpm start --hostname 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
