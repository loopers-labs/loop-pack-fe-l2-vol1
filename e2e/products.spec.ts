import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const slowProductsDelayMs = 1_500;

async function selectFilterOption(page: Page, label: string, option: string) {
  await page.getByRole("button", { name: label }).click();
  await page.getByText(option).click();
}

test.describe("상품 목록 E2E", () => {
  test("상품 목록 페이지는 production 라우트에서 상품 목록과 필터를 보여준다", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "상품 목록", level: 1 })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "검색" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카테고리" })).toBeVisible();
    await expect(page.getByRole("button", { name: "정렬" })).toBeVisible();
    await expect(page.getByLabel("상품 목록")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).toBeVisible();
  });

  test("상품 API가 실패하면 최초 실패 화면과 다시 시도 버튼을 보여준다", async ({ page }) => {
    await page.goto("/products?scenario=error");

    await expect(page.getByText("상품 목록을 불러오지 못했습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
    await expect(page.getByLabel("상품 목록")).not.toBeVisible();
  });

  test("상품 API가 지연 응답해도 document 진입을 막지 않고 상품 목록으로 전환된다", async ({
    page,
  }) => {
    const navigationStartedAt = performance.now();

    await page.goto("/products?scenario=slow", { waitUntil: "commit" });

    const documentCommitElapsedMs = performance.now() - navigationStartedAt;
    expect(documentCommitElapsedMs).toBeLessThan(slowProductsDelayMs);

    await expect(page.getByLabel("상품을 불러오는 중입니다.").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).toBeVisible();
    await expect(page.getByLabel("상품을 불러오는 중입니다.")).toHaveCount(0);
  });

  test("URL query로 직접 진입하면 필터 상태와 상품 목록을 복원한다", async ({ page }) => {
    await page.goto("/products?q=스탠리&category=home&sort=price-desc");

    await expect(page.getByRole("textbox", { name: "검색" })).toHaveValue("스탠리");
    await expect(page.getByRole("button", { name: "카테고리" })).toContainText("홈");
    await expect(page.getByRole("button", { name: "정렬" })).toContainText("높은 가격순");
    await expect(page.getByRole("heading", { name: "스탠리 클래식 런치박스" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).not.toBeVisible();
  });

  test("새로고침해도 URL query 기반 필터 상태와 상품 목록을 유지한다", async ({ page }) => {
    await page.goto("/products?q=스탠리&category=home&sort=price-desc");

    await expect(page.getByRole("heading", { name: "스탠리 클래식 런치박스" })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("textbox", { name: "검색" })).toHaveValue("스탠리");
    await expect(page.getByRole("button", { name: "카테고리" })).toContainText("홈");
    await expect(page.getByRole("button", { name: "정렬" })).toContainText("높은 가격순");
    await expect(page.getByRole("heading", { name: "스탠리 클래식 런치박스" })).toBeVisible();
    await expect(page).toHaveURL(/q=%EC%8A%A4%ED%83%A0%EB%A6%AC/);
    await expect(page).toHaveURL(/category=home/);
    await expect(page).toHaveURL(/sort=price-desc/);
  });

  test("뒤로 가기와 앞으로 가기로 URL query 기반 필터 상태를 복원한다", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).toBeVisible();

    await page.getByRole("textbox", { name: "검색" }).fill("스탠리");
    await expect(page).toHaveURL(/q=%EC%8A%A4%ED%83%A0%EB%A6%AC/);

    await selectFilterOption(page, "카테고리", "홈");
    await selectFilterOption(page, "정렬", "높은 가격순");

    await expect(page).toHaveURL(/q=%EC%8A%A4%ED%83%A0%EB%A6%AC/);
    await expect(page).toHaveURL(/category=home/);
    await expect(page).toHaveURL(/sort=price-desc/);
    await expect(page.getByRole("heading", { name: "스탠리 클래식 런치박스" })).toBeVisible();

    await page.goBack();

    await expect(page.getByRole("button", { name: "정렬" })).toContainText("최신순");
    await expect(page).not.toHaveURL(/sort=price-desc/);

    await page.goForward();

    await expect(page.getByRole("textbox", { name: "검색" })).toHaveValue("스탠리");
    await expect(page.getByRole("button", { name: "카테고리" })).toContainText("홈");
    await expect(page.getByRole("button", { name: "정렬" })).toContainText("높은 가격순");
    await expect(page.getByRole("heading", { name: "스탠리 클래식 런치박스" })).toBeVisible();
  });

  test("상품을 장바구니에 담으면 Header 개수가 누적 갱신된다", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: /Winter Rocky Pants/ })).toBeVisible();
    await expect(page.getByLabel("장바구니 0")).toBeVisible();

    const firstProductCartButton = page.getByRole("button", {
      name: "1번 상품 장바구니",
      exact: true,
    });

    await firstProductCartButton.click();
    await expect(page.getByLabel("장바구니 1")).toBeVisible();

    await firstProductCartButton.click();
    await expect(page.getByLabel("장바구니 2")).toBeVisible();
  });
});
