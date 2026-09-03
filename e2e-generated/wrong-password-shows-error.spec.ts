// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("로그인과 접근 제어", () => {
  test("비밀번호가 틀리면 오류 문구를 보여주고 로그인 상태로 바뀌지 않는다", async ({ page }) => {
    // 1. `/login` 으로 이동한다
    await page.goto("/login");

    // 2. "이메일"에 `looper5@loopers.dev`, "비밀번호"에 `wrongpassword` 를 입력한다
    await page.getByLabel("이메일").fill("looper5@loopers.dev");
    await page.getByLabel("비밀번호").fill("wrongpassword");

    // 3. "로그인" 버튼을 클릭한다
    await page.getByRole("button", { name: "로그인" }).click();

    // `이메일 또는 비밀번호를 확인해주세요.` 가 alert 으로 보인다
    const formAlert = page.getByRole("form", { name: "로그인" }).getByRole("alert");
    await expect(formAlert).toHaveText("이메일 또는 비밀번호를 확인해주세요.");

    // `/login` 에 그대로 남는다 (이동 없음)
    await expect(page).toHaveURL("/login");

    // 헤더에는 여전히 `로그인` 링크가 보이고 `로그아웃` 버튼은 없다
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(header.getByRole("button", { name: "로그아웃" })).toBeHidden();
  });
});
