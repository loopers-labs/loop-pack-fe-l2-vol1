import { test } from "@playwright/test";

// init-agents가 만든 generator 입력용 seed다. generator가 시나리오를 실행할 때
// 출발 상태로 참조한다. `expect` import는 지웠다 — 쓰지 않는데 두면
// no-unused-vars에 걸린다(스타터 코드를 받을 때마다 나오는 자리다).
//
// 이 파일은 playwright.config.ts의 testIgnore로 스위트에서 제외했다.
test.describe("Test group", () => {
  test("seed", async ({ page }) => {
    await page.goto("/");
  });
});
