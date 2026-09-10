// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("로그인과 접근 제어", () => {
  test("유효한 자격 증명으로 로그인하면 헤더가 로그인 상태로 바뀐다", async ({ page }) => {
    // 1. `/login` 으로 이동한다
    await page.goto("/login");

    // 2. "이메일" 입력란에 `looper5@loopers.dev` 를 입력한다
    await page.getByLabel("이메일").fill("looper5@loopers.dev");

    // 3. "비밀번호" 입력란에 `looper1234` 를 입력한다
    await page.getByLabel("비밀번호").fill("looper1234");

    // 4. "로그인" 버튼을 클릭한다
    await page.getByRole("button", { name: "로그인" }).click();

    // 홈(`/`)으로 이동한다 (`next` 파라미터가 없으므로 기본 복원 경로)
    await expect(page).toHaveURL("/");

    // 헤더에 `루퍼5님` 텍스트와 `마이페이지` · `주문 내역` 링크, `로그아웃` 버튼이 보인다
    const header = page.getByRole("banner");
    await expect(header.getByText("루퍼5님")).toBeVisible();
    await expect(header.getByRole("link", { name: "마이페이지" })).toBeVisible();
    await expect(header.getByRole("link", { name: "주문 내역" })).toBeVisible();
    await expect(header.getByRole("button", { name: "로그아웃" })).toBeVisible();

    // 헤더의 `로그인` 링크는 더 이상 보이지 않는다
    await expect(header.getByRole("link", { name: "로그인" })).toBeHidden();
  });
});
