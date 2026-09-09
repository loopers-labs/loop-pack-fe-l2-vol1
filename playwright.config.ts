import { defineConfig, devices } from '@playwright/test';

const CI_RETRY_COUNT = 2;
const WEB_SERVER_TIMEOUT_MS = 120_000;
const DEV_PORT = 3000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? CI_RETRY_COUNT : 0,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    trace: 'on-first-retry',
  },
  // setup이 먼저 돌아 계정 8개 전부 로그인하고 .auth/worker-N.json을
  // 만들어둔다. e2e 프로젝트는 dependencies로 setup 완료를 기다린 뒤 시작한다
  // (9주차 RFC 참고: 로그인 로직은 setup 한 곳에만 두고, 워커는 그중 어느
  // 파일을 읽을지만 fixtures.ts에서 고른다).
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  // production build 위에서 실행 (개발 서버 아님)
  webServer: {
    command: 'pnpm build && pnpm start',
    url: `http://localhost:${DEV_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: WEB_SERVER_TIMEOUT_MS,
  },
});
