import { defineConfig, devices } from '@playwright/test'

// 7주차 성능 과제의 "행동축" 증거 수집용 설정 (제출물이 아니라 관측 도구).
//
// 증거는 두 축으로 나눈다 — 섞으면 Before/After 비교가 무효가 된다.
//   지표축: Lighthouse CLI(시뮬레이션 스로틀) — FCP·LCP·CLS 수치
//   행동축: 여기 — 목록의 최초 진입/갱신/0건/실패/취소 화면과 URL 정합성
// Playwright Chromium은 Lighthouse와 스로틀 조건이 달라 수치 비교에 쓰지 않는다.
//
// 스로틀을 걸지 않는 이유: 관측 대상인 지연이 서버측 1.5초(scenario=slow)라
// 네트워크 스로틀을 더하면 원인이 섞인다. 여기서는 지연 하나만 통제한다.

const BASE_URL = 'http://localhost:3000'
const SERVER_BOOT_TIMEOUT_MS = 120 * 1000

export default defineConfig({
  testDir: './e2e',
  // 1.5초 지연을 여러 번 통과해야 하므로 기본 30초로는 모자란다.
  timeout: 60 * 1000,
  // 관측은 결정적이어야 한다 — 병렬·재시도는 같은 조건 재현을 깨뜨린다.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    // 녹화·trace가 곧 제출 증거다. 성공한 실행에서도 남겨야 하므로 항상 켠다.
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // production build를 대상으로 한다(dev 서버 측정 금지). `pnpm build`는 먼저 돌려둔다.
  webServer: {
    command: 'pnpm start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: SERVER_BOOT_TIMEOUT_MS,
  },
})
