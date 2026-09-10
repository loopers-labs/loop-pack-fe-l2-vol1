// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("로그인과 접근 제어", () => {
  test("미로그인 상태로 보호 경로에 들어가면 로그인 뒤 원래 경로로 돌아온다", async ({ page }) => {
    // 1. 쿠키가 없는 상태로 `/mypage` 로 이동한다
    await page.goto("/mypage");

    // 2. 주소가 `/login?next=%2Fmypage` 인 것을 확인한다
    // `/login?next=%2Fmypage` 로 리다이렉트되고 "로그인" 제목과 로그인 폼이 보인다
    await expect(page).toHaveURL("/login?next=%2Fmypage");
    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("form", { name: "로그인" })).toBeVisible();

    // 3. "이메일"에 `looper5@loopers.dev`, "비밀번호"에 `looper1234` 를 입력한다
    await page.getByLabel("이메일").fill("looper5@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");

    // 4. "로그인" 버튼을 클릭한다
    await page.getByRole("button", { name: "로그인" }).click();

    // 로그인 후 `/mypage` 로 이동한다
    await expect(page).toHaveURL("/mypage");

    // 마이페이지에 이름 `루퍼5` 와 이메일 `looper5@loopers.dev` 가 보인다
    const mypage = page.getByRole("region", { name: "마이페이지", exact: true });
    await expect(mypage.getByText("루퍼5", { exact: true })).toBeVisible();
    await expect(mypage.getByText("looper5@loopers.dev")).toBeVisible();

    // `주문 내역 보기` · `주문서로 이동` 링크와 `로그아웃` 버튼이 보인다
    const mypageMenu = mypage.getByRole("navigation", { name: "마이페이지 메뉴" });
    await expect(mypageMenu.getByRole("link", { name: "주문 내역 보기" })).toBeVisible();
    await expect(mypageMenu.getByRole("link", { name: "주문서로 이동" })).toBeVisible();
    await expect(mypageMenu.getByRole("button", { name: "로그아웃" })).toBeVisible();
  });
});
