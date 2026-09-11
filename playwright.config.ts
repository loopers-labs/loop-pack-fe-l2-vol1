import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // CI만 재시도 2회 — 일시적 흔들림(flaky 표기)과 지속 실패를 구분한다.
  // 로컬은 0으로 두어 흔들림을 즉시 노출한다.
  retries: process.env.CI ? 2 : 0,
  // json은 CI summary의 passed/flaky/failed 집계 입력이다.
  reporter: process.env.CI
    ? [
        ['list'],
        ['json', { outputFile: 'reports/e2e-results.json' }],
        ['html', { open: 'never' }],
      ]
    : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    // trace는 CI 실패 사후 분석용 증거로만 수집한다.
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
      },
    },
  ],
  webServer: {
    // CI는 직전 step에서 이미 production build를 수행하므로 start만 한다 (중복 build 제거).
    command: process.env.CI ? 'pnpm start' : 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    env: { APP_ORIGIN: 'http://localhost:3000' },
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
