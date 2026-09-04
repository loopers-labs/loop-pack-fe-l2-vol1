import type { Page } from "@playwright/test";

import { expect, test } from "./auth-fixtures";

// /cart 첫 항목의 상품 id를 읽는다. 항목 텍스트는 "{id}빼기"라, 숫자까지 포함해 전체 id를 뽑아 "p3"와 "p30"을 구분한다.
async function firstCartItemId(page: Page): Promise<string> {
  const text = await page.getByRole("listitem").first().textContent();
  const id = text?.match(/p\d+/)?.[0];
  expect(id, "장바구니 첫 항목에서 상품 id를 읽어야 한다").toBeTruthy();
  return id as string;
}

// 상품 하나를 담고 장바구니로 이동해 담긴 상품 id를 돌려준다(A·B 공통 준비).
async function addFirstProductAndOpenCart(page: Page): Promise<string> {
  await page.goto("/products");
  // 담기 버튼 aria-label은 "{상품명} 장바구니"라 끝이 "장바구니"다(찜은 위시리스트라 안 걸린다).
  const addButton = page.getByRole("button", { name: /장바구니$/ }).first();
  await addButton.click();
  await expect(addButton).toHaveAttribute("aria-pressed", "true");
  // 헤더 장바구니 링크(개수 포함)로 /cart 이동 — 담기 버튼(role=button)과 달리 role=link라 구분된다.
  await page.getByRole("link", { name: /장바구니 \d/ }).click();
  await expect(page).toHaveURL(/\/cart/);
  return firstCartItemId(page);
}

test.describe("주문", () => {
  test("담은 상품이 주문서를 거쳐 주문내역에 그대로 반영된다", async ({ page }) => {
    const productId = await addFirstProductAndOpenCart(page);

    await page.getByRole("link", { name: "주문서로 이동" }).click();
    await expect(page).toHaveURL(/\/order-form/);
    await page.getByRole("button", { name: "주문하기" }).click();
    await expect(page).toHaveURL(/\/orders/);

    // 핸드오프: 담은 상품 id가 최신 주문(.last())에 "{id} × 1"로 정확히 뜬다.
    // 워커별 계정 격리라 .last()는 이번 주문이고, 라인 전체 정확일치라 "p3"가 "p30 × 1"에 부분매치되지 않는다.
    await expect(page.getByText(`${productId} × 1`, { exact: true }).last()).toBeVisible();
    // 성공 대비: 주문이 완료되면 장바구니가 비워진다(B의 "실패→유지"와 짝을 이뤄 인과를 닫는다).
    await expect(page.getByRole("link", { name: /장바구니 0/ })).toBeVisible();
  });

  test("주문이 실패하면 장바구니를 비우지 않는다", async ({ page, context }) => {
    const productId = await addFirstProductAndOpenCart(page);

    // error 시나리오로 주문 POST만 500이 나게 한다(cart는 onSuccess에만 비워지므로 실패 땐 유지된다).
    await context.addCookies([
      { name: "scenario", value: "error", domain: "localhost", path: "/" },
    ]);

    await page.getByRole("link", { name: "주문서로 이동" }).click();
    await expect(page).toHaveURL(/\/order-form/);
    // alert은 main 안으로 좁힌다. Next가 클라 내비마다 body 직속에 두는 라우트 어나운서
    // (role=alert, 페이지 title을 읽어줌)가 main 밖이라, 이걸로 앱 에러 alert만 남긴다.
    const appAlert = page.getByRole("main").getByRole("alert");
    // 실패 전엔 앱 alert이 없다 → 이 alert이 '이번 실패'의 것임을 전→후로 못박는다.
    await expect(appAlert).toHaveCount(0);

    await page.getByRole("button", { name: "주문하기" }).click();
    // main 안 alert은 주문 실패 것으로 유일하다(이 앱엔 성공 토스트가 없다).
    await expect(appAlert).toBeVisible();

    // 유지: 장바구니로 돌아가면 담았던 그 상품 id가 그대로 있다(baseline 전→후 동일).
    await page.getByRole("link", { name: /장바구니 \d/ }).click();
    await expect(page).toHaveURL(/\/cart/);
    expect(await firstCartItemId(page)).toBe(productId);
  });
});
