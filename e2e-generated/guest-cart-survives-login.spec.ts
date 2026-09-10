// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("장바구니와 주문", () => {
  test("미로그인 상태에서 담은 장바구니가 로그인 뒤 주문서에 그대로 남는다", async ({ page }) => {
    const header = page.getByRole("banner");
    const mainNav = header.getByRole("navigation", { name: "주요 메뉴" });

    // 1. 쿠키가 없는 상태로 `/products` 로 이동한다
    await page.goto("/products");

    // 2. 첫 상품의 장바구니 버튼을 클릭한다 (검수: 픽스처 이름 리터럴 대신 화면에서 읽는다)
    await expect(page.getByText(/총 \d+개/)).toBeVisible();
    const firstCard = page.getByRole("article").first();
    const productName = await firstCard.getByRole("heading", { level: 2 }).innerText();
    await firstCard.getByRole("button", { name: /장바구니$/ }).click();

    // 미로그인 상태에서도 헤더가 `장바구니 1` 로 바뀐다
    await expect(mainNav.getByRole("link", { name: "장바구니 1" })).toBeVisible();
    await expect(header.getByRole("link", { name: "로그인" })).toBeVisible();

    // 3. 헤더의 `장바구니 1` 링크를 클릭한다
    await mainNav.getByRole("link", { name: "장바구니 1" }).click();

    // `/login?next=%2Fcheckout` 으로 리다이렉트되고, 이때도 헤더는 `장바구니 1` 을 유지한다
    await expect(page).toHaveURL("/login?next=%2Fcheckout");
    await expect(mainNav.getByRole("link", { name: "장바구니 1" })).toBeVisible();

    // 4. 로그인 화면에서 "이메일"에 `looper6@loopers.dev`, "비밀번호"에 `looper1234` 를 입력하고 "로그인" 버튼을 클릭한다
    await page.getByLabel("이메일").fill("looper6@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");
    await page.getByRole("button", { name: "로그인" }).click();

    // `/checkout` 으로 복원 이동한다
    await expect(page).toHaveURL("/checkout");

    // 주문서에 담은 상품과 총 결제 금액이 보이고 `주문하기` 버튼이 활성 상태다
    const checkout = page.getByRole("region", { name: "주문서", exact: true });
    await expect(
      checkout.getByRole("list", { name: "주문 상품" }).getByRole("listitem"),
    ).toContainText(productName);
    await expect(checkout.getByText(/총 결제 금액\s*[\d,]+원/)).toBeVisible();
    await expect(checkout.getByRole("button", { name: "주문하기" })).toBeEnabled();

    // 헤더에 `루퍼6님` 이 보인다
    await expect(header.getByText("루퍼6님")).toBeVisible();
  });
});
