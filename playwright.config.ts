import { defineConfig, devices } from '@playwright/test'

const AUTH_SESSION_SECRET = 'loopers-week09-playwright-secret'
process.env.AUTH_SESSION_SECRET = AUTH_SESSION_SECRET

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start',
    env: {
      AUTH_SESSION_SECRET,
    },
    url: 'http://localhost:3000',
    reuseExistingServer: false,
  },
})
