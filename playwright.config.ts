import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  /*
   * webkit도 같이 돌린다 — Safari는 버튼 클릭 시 자동 포커스를 주지 않아, 마우스로 연 후
   * 키보드로 조작하는 흐름이 chromium에서만 통과하고 여기선 깨질 수 있다(실제로 한 번 잡았다).
   */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
