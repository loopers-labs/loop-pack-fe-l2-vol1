import { defineConfig, devices } from '@playwright/test';

// [AI] E2E 검증 설정. production build를 자동 시작하고 chromium로 브라우저 검증한다.
// vitest(단위/컴포넌트)와 분리되며 testDir를 e2e/로 한정한다.
//
// week-09 4-1 프로젝트 구조:
//   setup      — auth.setup.ts: 계정 8개 로그인 1회 → .auth/worker-N.json 저장
//   chromium   — 기존 스펙 + 로그인 상태가 필요한 스펙(e2e/fixtures.ts의 test 사용).
//                setup에 의존해 storageState 파일이 준비된 뒤 실행된다.
//   auth       — 인증 자체를 검증하는 스펙(e2e/auth/). storageState를 "구조적으로" 못 쓰는
//                프로젝트로 분리했다 — 저장된 로그인 상태로는 로그인 과정을 검증할 수 없기 때문.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      testIgnore: /auth\//,
    },
    {
      name: 'auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\/.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
