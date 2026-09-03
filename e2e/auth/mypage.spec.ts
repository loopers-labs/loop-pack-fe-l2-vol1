import { test, expect } from "../fixtures/auth";

// storageState 로 이미 로그인된 상태를 재사용한다 — 로그인 폼을 다시 채우지 않는다.
// 워커마다 계정이 다르므로(parallelIndex → looper{n+1}) 이 화면엔 이 워커의 계정 정보가 떠야 한다.
test.describe("인증 — 로그인 재사용(storageState)", () => {
  test("로그인된 사용자의 마이페이지에 그 워커의 계정 정보가 뜬다", async ({
    page,
  }) => {
    // fixture 가 로그인한 계정 = 이 테스트가 도는 워커의 계정(같은 parallelIndex).
    const workerIndex = test.info().parallelIndex;
    const email = `looper${workerIndex + 1}@loopers.dev`;

    await page.goto("/mypage");

    await expect(
      page.getByRole("heading", { name: "마이페이지" }),
    ).toBeVisible();
    // 이메일은 마이페이지 본문에만 나와(헤더는 이름만) 워커별 계정을 명확히 특정한다.
    await expect(page.getByText(email)).toBeVisible();
  });
});
