import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // 계정이 8개뿐이라 병렬 슬롯도 8을 넘을 수 없다(넘으면 accountForSlot이 던진다).
  // 다만 실제 실행은 4로 둔다 — 8코어에서 워커 8개와 Next 서버가 함께 돌면 서로를 굶겨
  // 로직과 무관한 타임아웃이 난다(docs/rfc/week09-e2e-scope.md의 「4단계 경계」).
  workers: 4,
  reporter: 'list',
  // 기본 5초는 이 앱에 빠듯하다. 인증 API가 호출마다 500ms를 쉬고(스타터의 waitForAuthApi),
  // 주문 내역은 주문 1개 + 상품 3페이지를 동시에 연다. 병렬 실행에서 그 합이 5초를 넘는다.
  // 시간으로 기다리는 것이 아니라 조건이 만족될 때까지의 상한을 늘리는 것이다.
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    // 실패한 테스트만 trace를 남긴다. 항상 켜면 통과한 실행까지 파일이 쌓인다.
    trace: 'retain-on-failure',
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
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
