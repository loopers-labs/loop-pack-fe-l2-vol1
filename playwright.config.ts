import { defineConfig, devices } from '@playwright/test';
import { BASE_URL as baseURL } from './e2e/base-url';

// E2E는 production build 위에서만 의미가 있다 — 개발 서버로 통과하는 건 인정하지 않는다.
// webServer가 `pnpm start`를 쓰므로 앞서 `pnpm build`가 끝나 있어야 한다.
// `pnpm check`가 build → test:e2e 순서라 빌드는 1회만 돈다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // CI에서만 1회 재시도한다. 실패를 감추려는 게 아니다 — Playwright는 재시도 뒤 통과한
  // 테스트를 `flaky`로 따로 세서 보고하므로, 재시도는 결과를 숨기는 대신 이름을 붙인다.
  // 로컬은 0을 유지한다. 흔들림을 그 자리에서 보는 게 낫고, 재시도가 원인 추적을 흐린다.
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // 시각적 회귀의 픽셀 허용치. 기본값 0.2는 YIQ 색 거리 기준이라 회색 #ececec → #e3e3e3(9/255)를
  // "같다"고 본다 — 의도한 변경 실험에서 실제로 통과해 버렸다(RFC H절). 이 앱은 애니메이션·폰트
  // 로딩이 없어 같은 트리는 픽셀까지 같으므로(3회 연속 동일) 허용치 없이 본다.
  expect: { toHaveScreenshot: { threshold: 0 } },
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
