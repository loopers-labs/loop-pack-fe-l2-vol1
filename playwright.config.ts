import { defineConfig, devices } from "@playwright/test";

// 진짜 브라우저에서 도는 E2E. jsdom이 못 하는 레이아웃(floating 위치)·실제 스크롤/키보드 경로를 본다.
// 유닛(vitest)은 e2e/를 제외하므로 러너가 서로 겹치지 않는다.
// E2E는 `pnpm test`(vitest)에 넣지 않고 별도 `pnpm test:e2e`로 둔다. 프로덕션 빌드+실브라우저라
// 느리고 잘 깨져, 매 커밋 도는 유닛·통합의 빠른 피드백과 분리하는 편이 낫다.
// 기본은 로컬 프로덕션 빌드(:3000). 앱 APP_ORIGIN이 그 origin으로 고정돼 있어(서버 self-fetch가 이 포트를 부른다)
// 같은 포트를 쓴다. E2E_BASE_URL을 주면 이미 떠 있는 그 주소에 대고 돌고(배포본 스모크 등) 로컬 서버는 안 띄운다.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // 계정이 8개라 워커도 8개까지만 각자 다른 계정을 잡는다(그 이상이면 계정이 겹쳐 주문 격리가 깨진다).
  // CI 러너는 4 vCPU라 8개를 띄우면 서로 CPU를 뺏어 타임아웃이 난다. 4·1 워커가 8과 같은 결과를 내는 건 9주차에서 확인했다.
  workers: process.env.CI ? 4 : 8,
  // 로컬은 0이다 — 재시도가 "실패 후 통과"를 가리면 결정성을 확인할 수 없다.
  // CI만 1이다 — 목적은 실패를 숨기는 게 아니라 흔들림과 진짜 실패를 가르는 것이다.
  // 진짜 실패는 두 번 다 실패해 빨강이고, 재시도로 통과한 것은 Playwright가 flaky로 따로 표시해
  // 아래 json 리포트를 거쳐 job summary에 드러난다.
  retries: process.env.CI ? 1 : 0,
  // 실패한 시도에만 trace를 남긴다(항상 켜면 무겁다). flaky의 첫 실패 시도도 실패라 trace가 남는다.
  // 실패를 직접 열 땐 --trace=on으로 강제한다.
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  // CI는 flaky 집계용 json을 함께 남긴다. github 리포터는 실패를 PR diff에 annotation으로 붙인다.
  reporter: process.env.CI
    ? [["list"], ["github"], ["json", { outputFile: "playwright-report/results.json" }]]
    : "list",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 프로덕션 빌드 위에서 돌린다. 개발 서버로만 통과하는 E2E는 인정하지 않는다.
  // E2E_BASE_URL로 외부 서버를 가리키면 그 서버를 쓰므로 로컬 빌드를 띄우지 않는다.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        // CI(reuseExistingServer=false)는 매번 fresh 빌드라 항상 프로덕션이다. 로컬은 이미 띄운 서버를 재사용하는데,
        // reuseExistingServer는 dev·prod를 구분 못 하니 :3000에 dev(pnpm dev)를 띄운 채 돌리지 말 것 — 프로덕션을 먼저 띄운다.
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
