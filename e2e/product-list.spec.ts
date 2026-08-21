import { expect, test } from "@playwright/test";

// 13·14·15번 항목 — 진짜 브라우저여야만 되는 것.
//
// production build 위에서 돈다(playwright.config.ts의 webServer). 그래서 mock API의
// 500ms 고정 지연을 그대로 만난다. sleep으로 기다리지 않고 조건 기반 대기만 쓴다.
//
// 통합(jsdom)에서 이걸 못 보는 이유:
//   13 — jsdom엔 실제 히스토리 스택이 없다
//   14 — jsdom엔 새로고침이 없다
//   15 — 통합은 app/layout.tsx(Header)를 렌더하지 않는다

const list = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "상품 검색 결과" });

/** 목록이 실제로 그려질 때까지 기다린다 — 총 N개 문구가 그 신호다. */
async function waitForList(page: import("@playwright/test").Page) {
  await expect(list(page).getByText(/총 \d+개/)).toBeVisible();
}

test.describe("13번 — 뒤로·앞으로 가기로 필터 복원", () => {
  test("조작을 히스토리에 쌓아 뒤로 가면 이전 조건으로 돌아간다", async ({ page }) => {
    await page.goto("/products");
    await waitForList(page);

    const category = page.getByLabel("카테고리");
    await expect(category).toHaveValue("all");

    await category.selectOption("fashion");
    await expect(page).toHaveURL(/category=fashion/);
    await waitForList(page);

    await category.selectOption("home");
    await expect(page).toHaveURL(/category=home/);
    await waitForList(page);

    // history:"replace"로 바뀌면 여기서 all로 떨어지거나 아예 안 바뀐다 —
    // 조건을 URL에 둔 이유의 절반(복원)이 사라진 것이다.
    await page.goBack();
    await expect(page).toHaveURL(/category=fashion/);
    await expect(category).toHaveValue("fashion");

    await page.goBack();
    await expect(category).toHaveValue("all");

    await page.goForward();
    await expect(page).toHaveURL(/category=fashion/);
    await expect(category).toHaveValue("fashion");
  });

  test("정렬과 카테고리를 각각 되돌린다", async ({ page }) => {
    await page.goto("/products");
    await waitForList(page);

    await page.getByLabel("카테고리").selectOption("digital");
    await expect(page).toHaveURL(/category=digital/);
    await page.getByLabel("정렬").selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);

    await page.goBack();

    // 돌아간 자리가 목록인지 URL로 먼저 본다. 라벨부터 조회하면 히스토리가 앱 밖으로
    // 나갔을 때 "element(s) not found"만 남아 셀렉터 문제처럼 읽힌다.
    await expect(page).toHaveURL(/category=digital/);

    // 정렬 변경만 되돌아가고 카테고리는 유지되어야 한다.
    await expect(page.getByLabel("정렬")).toHaveValue("latest");
    await expect(page.getByLabel("카테고리")).toHaveValue("digital");
  });
});

test.describe("14번 — 새로고침해도 필터가 유지된다", () => {
  test("URL에 담긴 조건이 새로고침 뒤에도 화면에 복원된다", async ({ page }) => {
    // 카테고리를 걸지 않는다. mock 데이터는 카테고리마다 6개뿐이라(총 30개 / 5종)
    // 필터를 걸면 12개씩 나누는 페이지가 1개뿐이고 page=2는 0건이 된다.
    // 페이지 지속은 전체 조건에서만 볼 수 있다.
    await page.goto("/products?sort=price-desc&page=2");
    await waitForList(page);

    const before = await list(page).getByRole("heading", { level: 3 }).allTextContents();
    expect(before.length).toBeGreaterThan(0);

    await page.reload();
    await waitForList(page);

    // 이 앱은 필터를 localStorage에 두지 않는다 — URL이 복원의 유일한 근거다.
    await expect(page.getByLabel("정렬")).toHaveValue("price-desc");
    await expect(list(page).getByText("2 / 3")).toBeVisible();

    const after = await list(page).getByRole("heading", { level: 3 }).allTextContents();
    expect(after).toEqual(before);
  });

  test("조작해서 만든 URL도 새로고침을 견딘다", async ({ page }) => {
    await page.goto("/products");
    await waitForList(page);

    await page.getByLabel("카테고리").selectOption("goods");
    await expect(page).toHaveURL(/category=goods/);
    await waitForList(page);

    await page.reload();
    await waitForList(page);

    await expect(page.getByLabel("카테고리")).toHaveValue("goods");
  });
});

test.describe("15번 — 목록 진입 → 담기 → 헤더 확인", () => {
  test("production build에서 담은 것이 헤더 개수에 반영된다", async ({ page }) => {
    await page.goto("/products");
    await waitForList(page);

    const header = page.getByRole("banner");
    await expect(header.getByLabel(/장바구니 0개/)).toBeVisible();

    // 첫 카드의 담기 버튼. 이름은 "{상품명} 장바구니"다.
    const addButtons = list(page).getByRole("button", { name: /장바구니$/ });
    const first = addButtons.first();
    await expect(first).toHaveAttribute("aria-pressed", "false");

    await first.click();

    // hydration이 끝나기 전에 눌리면 여기서 0개로 남는다 — dev·통합에서는 안 잡힌다.
    await expect(header.getByLabel(/장바구니 1개/)).toBeVisible();
    await expect(first).toHaveAttribute("aria-pressed", "true");

    await addButtons.nth(1).click();
    await expect(header.getByLabel(/장바구니 2개/)).toBeVisible();

    await first.click();
    await expect(header.getByLabel(/장바구니 1개/)).toBeVisible();
  });

  test("찜과 장바구니가 헤더에서 따로 센다", async ({ page }) => {
    await page.goto("/products");
    await waitForList(page);

    const header = page.getByRole("banner");
    await list(page)
      .getByRole("button", { name: /위시리스트$/ })
      .first()
      .click();

    await expect(header.getByLabel(/위시리스트 1개/)).toBeVisible();
    await expect(header.getByLabel(/장바구니 0개/)).toBeVisible();
  });
});
