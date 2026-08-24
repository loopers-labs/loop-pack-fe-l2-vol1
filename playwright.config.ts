import { defineConfig, devices } from "@playwright/test";

// E2E 는 vitest 와 섞이지 않게 e2e/ 아래 *.spec.ts 로만.
// process.env.CI: GitHub Actions 등 CI 가 자동으로 넣는 값 → CI 에서만 truthy.
// 아래 여러 설정을 "로컬=개발 편의(빠름·디버그) / CI=엄격·안정"으로 갈라주는 스위치로 쓴다.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true, // 파일 내 테스트까지 전부 병렬
  // test.only(그것만 돌고 나머지 skip)를 지우지 않고 커밋하면 하나만 돌고도 초록불이 된다.
  // CI 에선 .only 가 있으면 아예 실패시켜 그 사고를 막는다(로컬은 개발 중이라 허용).
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // CI 만 flaky 대비 재시도, 로컬은 실패 즉시 노출
  workers: process.env.CI ? 1 : undefined, // CI 는 직렬(안정), 로컬은 기본 병렬
  reporter: process.env.CI ? "dot" : "list", // CI 는 짧게(dot), 로컬은 읽기 좋게(list)
  use: {
    baseURL: "http://localhost:3000", // page.goto("/") 등 상대경로의 기준 주소
    trace: "on-first-retry", // 실패해 재시도할 때만 추적 저장(상시 저장은 느림)
  },
  // 데스크톱 Chrome 하나만. firefox/webkit/모바일 프리셋은 이 배열에 추가.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 테스트 전 앱 서버를 자동 기동. dev 서버가 아니라 production build 위에서 돌린다(과제 요구).
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000", // 이 주소가 응답하면 "떴다"고 보고 테스트 시작
    reuseExistingServer: !process.env.CI, // 로컬은 이미 뜬 서버 재사용(빠름), CI 는 항상 새로
    timeout: 120_000, // build 가 오래 걸려 서버 뜰 때까지 최대 2분 대기
  },
});
