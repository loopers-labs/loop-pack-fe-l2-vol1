// spec: specs/auth-and-order.md
// seed: e2e-generated/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("장바구니와 주문", () => {
  test("담은 상품으로 주문하면 주문 내역으로 이동하고 장바구니가 비워진다", async ({ page }) => {
    const header = page.getByRole("banner");
    const mainNav = header.getByRole("navigation", { name: "주요 메뉴" });

    // 1. `/login` 에서 `looper6@loopers.dev` / `looper1234` 로 로그인한다
    await page.goto("/login");
    await page.getByLabel("이메일").fill("looper6@loopers.dev");
    await page.getByLabel("비밀번호").fill("looper1234");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL("/");

    // 2. 헤더의 `상품` 링크로 `/products` 로 이동한다
    await mainNav.getByRole("link", { name: "상품", exact: true }).click();
    await expect(page).toHaveURL("/products");

    // 3–4. 목록의 처음 두 상품을 담는다 (검수: 픽스처 이름·가격 리터럴 대신 화면에서 읽어 뒤에서 비교한다)
    await expect(page.getByText(/총 \d+개/)).toBeVisible();
    const cards = page.getByRole("article");
    const firstName = await cards.nth(0).getByRole("heading", { level: 2 }).innerText();
    const secondName = await cards.nth(1).getByRole("heading", { level: 2 }).innerText();
    await cards
      .nth(0)
      .getByRole("button", { name: /장바구니$/ })
      .click();
    await cards
      .nth(1)
      .getByRole("button", { name: /장바구니$/ })
      .click();

    // 5. 헤더의 `장바구니 2` 링크를 클릭한다
    await mainNav.getByRole("link", { name: "장바구니 2" }).click();

    // `/checkout` 으로 이동하고 "주문 상품" 목록에 담은 두 상품이 보인다
    await expect(page).toHaveURL("/checkout");
    const checkout = page.getByRole("region", { name: "주문서", exact: true });
    await expect(checkout.getByRole("heading", { name: "주문서" })).toBeVisible();

    // 6. 주문서의 상품 목록과 총 결제 금액을 확인한다
    const checkoutItems = checkout.getByRole("list", { name: "주문 상품" }).getByRole("listitem");
    await expect(checkoutItems.filter({ hasText: firstName })).toBeVisible();
    await expect(checkoutItems.filter({ hasText: secondName })).toBeVisible();
    await expect(checkout.getByText(/총 결제 금액\s*[\d,]+원/)).toBeVisible();

    // 7. `주문하기` 버튼을 클릭한다
    await checkout.getByRole("button", { name: "주문하기" }).click();

    // `/orders` 로 이동하고 "주문 내역" 제목이 보인다
    await expect(page).toHaveURL("/orders");
    const orders = page.getByRole("region", { name: "주문 내역", exact: true });
    await expect(orders.getByRole("heading", { name: "주문 내역" })).toBeVisible();

    // 방금 만든 주문 항목 안에 두 상품이 `수량 1` 로 보이고 합계가 보인다
    const latestOrder = orders.getByRole("article").first();
    const orderItems = latestOrder.getByRole("listitem");
    await expect(orderItems.filter({ hasText: firstName })).toContainText("수량 1");
    await expect(orderItems.filter({ hasText: secondName })).toContainText("수량 1");
    await expect(latestOrder.getByText(/합계\s*[\d,]+원/)).toBeVisible();

    // 헤더 링크가 `장바구니 0` 으로 비워진다
    await expect(mainNav.getByRole("link", { name: "장바구니 0" })).toBeVisible();

    // 헤더에는 여전히 `루퍼6님` 이 보인다
    await expect(header.getByText("루퍼6님")).toBeVisible();
  });
});
