// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("세션 만료와 로그아웃", () => {
  test("세션이 만료되면 만료 안내와 함께 로그인으로 보낸다", async ({ page, context }) => {
    const header = page.getByRole("banner");

    // 1. `/login` 에서 `looper5@loopers.dev` / `looper1234` 로 로그인하고 헤더에 `루퍼5님` 이 보이는 것을 확인한다
    await page.goto("/login");
    await page.getByLabel("이메일").fill("looper5@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/");
    await expect(header.getByText("루퍼5님")).toBeVisible();

    // 2. `context.addCookies` 로 `scenario=expired` 쿠키를 넣는다
    await context.addCookies([
      { name: "scenario", value: "expired", url: "http://localhost:3000" },
    ]);

    // 3. `/orders` 로 이동한다
    await page.goto("/orders");

    // 주소가 `/login?next=%2Forders&reason=expired` 로 바뀐다
    await expect(page).toHaveURL("/login?next=%2Forders&reason=expired");

    // `세션이 만료되었어요. 다시 로그인해 주세요.` 가 alert 으로 보인다
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "세션이 만료되었어요. 다시 로그인해 주세요.",
    );

    // 헤더가 미로그인 상태(`로그인` 링크)로 돌아가고 `루퍼5님` · `로그아웃` 은 사라진다
    await expect(header.getByRole("link", { name: "로그인" })).toBeVisible();
    await expect(header.getByText("루퍼5님")).toBeHidden();
    await expect(header.getByRole("button", { name: "로그아웃" })).toBeHidden();
  });
});
