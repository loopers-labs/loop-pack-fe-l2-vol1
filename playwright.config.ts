import { defineConfig, devices } from "@playwright/test";

const baseURL = `http://localhost:${process.env.PORT ?? "3000"}`;
const isCI = process.env.CI !== undefined;

export default defineConfig({
  testDir: "./e2e",
  // seed.spec.ts는 init-agents가 만든 generator 입력용 빈 테스트다. 스위트에서
  // 돌리면 아무것도 검증하지 않는 초록불 한 개가 늘어난다 — 비활성화한 테스트를
  // 두지 않는 규칙과 같은 이유로 제외한다. 파일은 남긴다(generator가 참조한다).
  testIgnore: ["seed.spec.ts"],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // 워커 수를 고정한다. 계정이 8개라 parallelIndex가 8을 넘으면 계정이 겹치고,
  // 겹치면 서로의 주문이 상대 목록에 보인다(e2e/support/accounts.ts).
  workers: 4,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // production build 위에서만 돈다. 개발 서버에서만 통과하는 건 인정되지 않고,
  // mock API의 500ms 고정 지연도 production에서만 나타난다(그걸 그대로 만나야 한다).
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    // 서버가 자기 Route Handler를 부를 절대 주소. 기본값이 없어서 안 주면 빌드가 죽는다
    // (src/shared/config/appOrigin.ts). E2E가 띄우는 서버도 예외가 아니다.
    env: { APP_ORIGIN: baseURL },
  },
});
