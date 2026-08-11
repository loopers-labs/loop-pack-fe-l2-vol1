import { expect, test } from "@playwright/test";

// 스모크 — Playwright 가 production build 위에서 실제로 뜨는지만 확인한다(0단계 검증용).
// 실제 E2E 테스트를 작성하면 이 파일은 삭제한다.
test("홈이 production build 위에서 렌더된다", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "홈" }),
  ).toBeVisible();
});
