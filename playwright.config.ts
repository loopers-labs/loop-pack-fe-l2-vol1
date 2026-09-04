// AI 생성
import { defineConfig, devices } from '@playwright/test';

export const APP_ORIGIN = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  retries: 0,
  use: {
    baseURL: APP_ORIGIN,
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // production build 위에서만 구동
    // test:e2e를 단독 실행하면 직전 빌드를 쓰게 되는데, 정확성은 CI(check 전체 실행)에서 보장
    command: 'pnpm start',
    url: APP_ORIGIN,
    // 로컬은 떠 있는 서버를 재사용해 빠른 실행, CI는 항상 프로덕션 기준 실행
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
