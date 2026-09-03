import { expect, test } from "./fixtures/auth";
import { Header } from "./pages/header";
import { loginUrl } from "./pages/urls";

// 주문 저장소는 서버 프로세스 메모리에 남고 실행마다 누적된다. 절대 개수 대신 "내 계정의 주문이 1건 늘었다" 로 단언한다
const readOrderCount = async (page: import("@playwright/test").Page) => {
  await page.goto("/orders");
  const summary = page.getByText(/^총 \d+건$/);
  const empty = page.getByText("아직 주문한 상품이 없어요");
  await expect(summary.or(empty)).toBeVisible();
  if (await empty.isVisible()) {
    return 0;
  }
  return Number((await summary.textContent())?.match(/\d+/)?.[0]);
};

test("담은 상품을 주문하면 주문 내역에 한 건 늘고, 로그아웃하면 주문 내역은 다시 잠긴다", async ({
  page,
}) => {
  const header = new Header(page);
  const before = await readOrderCount(page);

  await page.goto("/products");
  await expect(page.getByText(/총 \d+개/)).toBeVisible();
  const firstCard = page.getByRole("article").first();
  const productName = await firstCard.getByRole("heading", { level: 2 }).innerText();
  await firstCard.getByRole("button", { name: /장바구니$/ }).click();
  await expect(header.cartLink(1)).toBeVisible();

  await header.cartLink(1).click();
  await expect(page).toHaveURL("/checkout");
  await expect(page.getByRole("list", { name: "주문 상품" })).toContainText(productName);
  await expect(page.getByText("총 결제 금액")).toBeVisible();

  await page.getByRole("button", { name: "주문하기" }).click();

  await expect(page).toHaveURL("/orders");
  await expect(page.getByText(`총 ${before + 1}건`)).toBeVisible();
  await expect(page.getByRole("article").first()).toContainText(productName);
  await expect(header.cartLink(0)).toBeVisible();

  await header.logoutButton.click();
  await expect(page).toHaveURL("/");
  await expect(header.loginLink).toBeVisible();

  await page.goto("/orders");
  await expect(page).toHaveURL(loginUrl("/orders"));
});
