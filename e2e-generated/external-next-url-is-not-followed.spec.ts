// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("로그인과 접근 제어", () => {
  test("외부 URL 이 next 로 들어와도 그 주소로 보내지 않는다", async ({ page }) => {
    // 1. `/login?next=https%3A%2F%2Fevil.com` 으로 이동한다
    await page.goto("/login?next=https%3A%2F%2Fevil.com");

    // 2. "이메일"에 `looper5@loopers.dev`, "비밀번호"에 `looper1234` 를 입력한다
    await page.getByLabel("이메일").fill("looper5@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");

    // 3. "로그인" 버튼을 클릭한다
    await page.getByRole("button", { name: "로그인" }).click();

    // 로그인 후 같은 오리진의 홈(`/`)으로 이동한다
    await expect(page).toHaveURL("/");

    // 헤더에 `루퍼5님` 이 보인다
    await expect(page.getByRole("banner").getByText("루퍼5님")).toBeVisible();
  });
});
