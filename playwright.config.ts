import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

// E2E는 production build 위에서만 의미가 있다 — 개발 서버로 통과하는 건 인정하지 않는다.
// webServer가 `pnpm start`를 쓰므로 앞서 `pnpm build`가 끝나 있어야 한다.
// `pnpm check`가 build → test:e2e 순서라 빌드는 1회만 돈다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    // mock API의 500ms 고정 지연은 조건 기반 대기로 흡수한다 (sleep 금지).
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
