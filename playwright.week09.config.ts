import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:3109'
const SERVER_BOOT_TIMEOUT_MS = 120 * 1000

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'week08-chromium',
      testMatch: /week08-product-list\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'week09-contracts',
      testMatch: /week09\/accounts\.spec\.ts/,
    },
    {
      name: 'week09-auth-setup',
      testMatch: /week09\/auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'week09-chromium',
      testMatch: /week09\/(?:auth|order)\.spec\.ts/,
      dependencies: ['week09-auth-setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start --port 3109',
    url: BASE_URL,
    env: {
      APP_ORIGIN: BASE_URL,
    },
    reuseExistingServer: false,
    timeout: SERVER_BOOT_TIMEOUT_MS,
  },
})
