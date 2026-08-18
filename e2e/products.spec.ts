import { expect, test } from "@playwright/test";

const mockApiPort = process.env.MOCK_API_PORT ?? "4010";
const mockApiBaseURL = `http://127.0.0.1:${mockApiPort}`;

async function resetMockApi() {
  await fetch(`${mockApiBaseURL}/__test__/reset`, { method: "POST" });
}

async function setMockApiScenario(scenario: { products?: "success" | "empty" | "error" | "slow" }) {
  await fetch(`${mockApiBaseURL}/__test__/scenario`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(scenario),
  });
}

test.beforeEach(async () => {
  await resetMockApi();
});

test.describe("상품 목록 E2E", () => {
  test("상품 목록 페이지는 production 라우트에서 mock API 상품 목록과 필터를 보여준다", async ({
    page,
  }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "상품 목록", level: 1 })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "검색" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카테고리" })).toBeVisible();
    await expect(page.getByRole("button", { name: "정렬" })).toBeVisible();
    await expect(page.getByLabel("상품 목록")).toBeVisible();
    await expect(page.getByRole("heading", { name: "E2E Mock Backpack" })).toBeVisible();
  });

  test("mock API가 빈 상품 목록을 응답하면 0건 상태를 보여준다", async ({ page }) => {
    await setMockApiScenario({ products: "empty" });

    await page.goto("/products");

    await expect(page.getByText("조건에 맞는 상품이 없습니다.")).toBeVisible();
    await expect(page.getByText("총 0개")).toBeVisible();
    await expect(page.getByLabel("상품 목록")).not.toBeVisible();
  });

  test("mock API가 실패하면 최초 실패 화면과 다시 시도 버튼을 보여준다", async ({ page }) => {
    await setMockApiScenario({ products: "error" });

    await page.goto("/products");

    await expect(page.getByText("상품 목록을 불러오지 못했습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
    await expect(page.getByLabel("상품 목록")).not.toBeVisible();
  });
});
