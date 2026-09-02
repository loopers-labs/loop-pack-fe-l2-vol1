import { defineConfig, devices } from '@playwright/test'

// E2E는 production build 위에서만 돌린다. 개발 서버에서만 통과하는 결과는
// 사용자가 만나는 화면의 증거가 아니다. 실제로 다른 것이 최소 셋이다.
// 서버 컴포넌트의 사전 렌더, mock API의 500ms 고정 지연, 번들 분할 결과.
const PORT = 3000
const BASE_URL = `http://127.0.0.1:${PORT}`

// build와 runtime의 origin이 다르면 서버 렌더가 결과물에 다른 주소를 굳힌다.
// CI와 로컬이 같은 값을 쓰는지 여기서 확인하고, 다르면 조용히 진행하지 않는다.
if (process.env.APP_ORIGIN && process.env.APP_ORIGIN !== BASE_URL) {
  throw new Error(
    `APP_ORIGIN(${process.env.APP_ORIGIN})이 E2E base URL(${BASE_URL})과 다릅니다. build와 서버가 같은 origin을 써야 합니다.`,
  )
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // .only가 남으면 나머지 spec을 실행하지 않고 전체 결과가 통과로 표시된다.
  forbidOnly: Boolean(process.env.CI),
  // 재시도를 켜지 않는다. 비결정적인 실패를 재시도로 감추면 실제 결함과 구분하기 어렵다.
  // 대기는 전부 조건 기반이므로 재시도로 해결되는 실패도 실제 결함으로 취급한다.
  retries: 0,
  // 과제의 병렬 격리 기준이다. CLI의 --workers=1로 직렬 결과와 비교할 수 있다.
  workers: 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    // 재시도를 쓰지 않으므로 on-first-retry는 trace를 한 번도 만들지 않는다.
    // 실패한 최초 실행을 그대로 남겨 screenshot·video와 같은 조건으로 진단한다.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // 이 설정은 이미 만들어진 production 산출물 위에서 서버만 띄운다.
    // build를 여기에 넣으면 `pnpm check`처럼 앞에서 이미 build를 끝낸 명령이 같은 빌드를
    // 두 번 실행된다. 단독 실행 시에는 `pnpm test:e2e`가 먼저 build를 실행한다.
    // 산출물이 없으면 Next가 오류를 내고 종료한다. 개발 서버로 자동 전환하지 않는다.
    command: 'pnpm start',
    url: BASE_URL,
    // 로컬에서는 이미 떠 있는 서버를 재사용해 반복 실행을 빠르게 한다.
    // CI에서는 항상 새로 실행한다. 기존 서버가 이전 빌드를 제공하면 잘못된 결과가 나올 수 있다.
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // build와 runtime에 같은 origin을 넣는다. 서버 metadata와 prefetch가 절대 URL을 만든다.
    env: { APP_ORIGIN: BASE_URL },
  },
})
