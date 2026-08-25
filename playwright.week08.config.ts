import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:3108'
const SERVER_BOOT_TIMEOUT_MS = 120 * 1000

export default defineConfig({
  testDir: './e2e',
  testMatch: 'week08-*.spec.ts',
  timeout: 30 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start --port 3108',
    url: BASE_URL,
    env: {
      APP_ORIGIN: BASE_URL,
    },
    reuseExistingServer: false,
    timeout: SERVER_BOOT_TIMEOUT_MS,
  },
})
