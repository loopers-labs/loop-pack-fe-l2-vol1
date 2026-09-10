// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("세션 만료와 로그아웃", () => {
  test("로그아웃하면 홈으로 나가고 보호 경로 재방문이 다시 로그인으로 튕긴다", async ({ page }) => {
    const header = page.getByRole("banner");

    // 1. `/login` 에서 `looper5@loopers.dev` / `looper1234` 로 로그인한다
    await page.goto("/login");
    await page.getByLabel("이메일").fill("looper5@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/");

    // 2. `/mypage` 로 이동한다
    await page.goto("/mypage");
    await expect(page.getByRole("region", { name: "마이페이지", exact: true })).toBeVisible();

    // 3. `로그아웃` 버튼을 클릭한다
    await header.getByRole("button", { name: "로그아웃" }).click();

    // 홈(`/`)으로 이동하고 헤더가 `로그인` 링크만 보이는 미로그인 상태가 된다
    await expect(page).toHaveURL("/");
    await expect(header.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(header.getByText("루퍼5님")).toBeHidden();
    await expect(header.getByRole("button", { name: "로그아웃" })).toBeHidden();

    // 4. `/orders` 로 이동한다
    await page.goto("/orders");

    // `/login?next=%2Forders` 로 리다이렉트된다
    await expect(page).toHaveURL("/login?next=%2Forders");
    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();

    // 리다이렉트된 로그인 화면에는 `reason=expired` 안내가 없다 (정상 로그아웃은 만료가 아니다)
    await expect(page.getByText("세션이 만료되었어요. 다시 로그인해 주세요.")).toBeHidden();
  });
});
