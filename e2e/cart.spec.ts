// 목록 진입 → 담기 → 헤더 개수 확인 (사용자 전체 플로우).
import { expect, test } from "@playwright/test";

test.describe("week8 검증대상 15 — 목록에서 담으면 헤더 개수가 따라온다", () => {
  test("상품을 담으면 헤더 개수가 1로 오른다", async ({ page }) => {
    await page.goto("/products");

    // "담을 상품이 떴다"는 신호는 백엔드 개수 리터럴이 아니라 담기 버튼 자체로 잡는다.
    const addFirst = page.getByRole("button", { name: "장바구니" }).first();
    await expect(addFirst).toBeVisible();

    // 배지는 라이브 리전(role="status"), 이름은 "장바구니 N".
    const cartStatus = page.getByRole("status", { name: /^장바구니/ });
    // 복원(hydrate) 후 실제 개수 0 이 뜰 때까지 조건 대기(그 전엔 placeholder).
    await expect(cartStatus).toHaveText("장바구니 0");

    await addFirst.click();
    await expect(cartStatus).toHaveText("장바구니 1");
  });

  test("경계: 담은 상품을 다시 누르면 헤더 개수가 0으로 원복된다", async ({
    page,
  }) => {
    await page.goto("/products");

    const addFirst = page.getByRole("button", { name: "장바구니" }).first();
    await expect(addFirst).toBeVisible();

    const cartStatus = page.getByRole("status", { name: /^장바구니/ });
    await expect(cartStatus).toHaveText("장바구니 0");

    // 뺄 게 있어야 하므로 먼저 담는다(전제). 초점은 다시 눌러 원복되는 것.
    await addFirst.click();
    await expect(cartStatus).toHaveText("장바구니 1");

    await addFirst.click();
    await expect(cartStatus).toHaveText("장바구니 0");
  });
});
