import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 는 **production build 위에서** 돈다.
 *
 * `pnpm dev` 로 돌리지 않는 이유가 둘 있다. 이 앱은 서버 컴포넌트에서 자기 자신에게
 * 요청을 보내고(generateMetadata → apiClient → getAppOrigin) APP_ORIGIN 절대 URL 분기를
 * 쓰므로 dev 와 production 의 경로가 갈릴 수 있고, mock API 의 500ms 지연은
 * `NODE_ENV !== 'test'` 일 때만 나타난다. E2E 가 잡아야 할 대기 문제가 dev 에서는
 * 재현되지 않는다.
 *
 * webServer.command 가 `pnpm start` 이므로 선행 build 가 필요하다.
 * package.json 의 `check` 가 build 뒤에 test:e2e 를 두어 그 순서를 보장한다.
 */
const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';

/**
 * 서버 포트를 APP_ORIGIN 에서 뽑는다.
 *
 * 이 값은 build 시 metadataBase 로, runtime 에는 서버가 자기 자신에게 보내는 요청의
 * origin 으로 쓰인다. 서버를 다른 포트로 띄우면 그 self-fetch 가 엉뚱한 곳으로 나가
 * metadata 조회가 조용히 실패한다(page.tsx 의 catch 가 삼킨다). 그래서 포트를
 * 따로 두지 않고 APP_ORIGIN 하나에서 파생시킨다.
 */
const port = Number(new URL(APP_ORIGIN).port || 3000);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  // 9주차 4단계: 기본값에 기대지 않는다. 테스트 한 개, 단언 한 번의 최대 대기를 명시적으로 고정한다.
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  // worker 당 계정으로 로그인해 두는 storageState 파일이 쌓인다(e2e/fixtures/worker-auth.ts).
  // 실행 시작 시 1회만 비운다 — 워커 fixture 안에서 비우면 워커끼리 서로의 파일을 지운다.
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    baseURL: APP_ORIGIN,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm start -p ${port}`,
    url: APP_ORIGIN,
    env: { APP_ORIGIN },
    /**
     * 서버는 항상 직접 띄운다.
     *
     * `reuseExistingServer: true` 는 URL 이 응답하는지만 보고 그게 우리 앱인지는 보지
     * 않는다. 아끼는 것은 기동 시간 몇 초고, 잃는 것은 방금 통과한 E2E 가 무엇을
     * 상대로 통과했는지에 대한 확신이다. production build 를 검증하겠다고 정한 이상
     * 그 build 를 직접 띄우는 것이 앞뒤가 맞는다.
     *
     * 포트가 이미 쓰이고 있으면 bind 실패로 멈춘다. 그때는 APP_ORIGIN 의 포트를
     * 비어 있는 값으로 바꿔 준다. 예) APP_ORIGIN=http://localhost:3100 pnpm check
     */
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
