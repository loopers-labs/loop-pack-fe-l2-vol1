import { test } from "@playwright/test";

// `playwright init-agents` 가 만든 시드. planner 가 계획의 **Seed** 로 가리키고 generator 가 환경(설정·픽스처)을
// 읽는 기준 파일이다. 실행 대상은 아니다 — e2e-generated/ 는 playwright.config 의 testDir 밖이다
test.describe("Test group", () => {
  test("seed", async () => {
    // generate code here.
  });
});
