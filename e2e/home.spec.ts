import { expect, test } from "@playwright/test";

// 홈은 서버에서 프리패치해 첫 HTML에 데이터가 담긴다(Advanced B). 실제 렌더를 브라우저로 확인한다.

test("홈에 배너·카테고리·인기 상품·신상품이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "매일 새롭게 발견하는 취향" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible();
  // 섹션 제목은 h2로 좁힌다. 페이지 h1("… 인기 상품과 신상품")이 이 이름을 부분포함해,
  // level을 안 주면 h1과 섹션 h2가 함께 잡혀 strict 위반이 난다.
  await expect(page.getByRole("heading", { name: "인기 상품", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "신상품", level: 2 })).toBeVisible();
});

test("홈 첫 로드에서 클라이언트가 /api/home을 재요청하지 않는다", async ({ page }) => {
  // 서버가 prefetch해 dehydrate로 넘긴 데이터를 클라이언트가 그대로 쓰므로,
  // 초기 렌더에서 브라우저발 /api/home 요청이 0건이어야 한다(Advanced B의 중복 요청 없음).
  const homeApiRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/home")) {
      homeApiRequests.push(request.url());
    }
  });

  await page.goto("/");
  // 데이터가 첫 HTML에 이미 있어 서버 렌더 결과가 곧바로 보인다.
  await expect(page.getByRole("heading", { name: "매일 새롭게 발견하는 취향" })).toBeVisible();
  // 하이드레이션 뒤 재요청이 있었다면 네트워크가 잠잠해지기 전에 잡힌다. 고정 sleep 대신
  // 네트워크 정지(조건)를 기다려, 늦은 재요청도 놓치지 않고 결정적으로 확인한다.
  await page.waitForLoadState("networkidle");

  expect(homeApiRequests).toHaveLength(0);
});

test("홈에서 담은 상품이 목록으로 이동해도 담긴 상태로 보인다", async ({ page }) => {
  await page.goto("/");

  const firstCart = page.getByRole("button", { name: /장바구니$/ }).first();
  await firstCart.click();
  await expect(page.getByText(/장바구니 1/)).toBeVisible();

  await page.getByRole("link", { name: "상품", exact: true }).click();
  await expect(page).toHaveURL(/\/products/);
  // 헤더 개수는 화면을 옮겨도 유지된다.
  await expect(page.getByText(/장바구니 1/)).toBeVisible();
});

test("찜하면 하트가 채워진 상태로 바뀐다", async ({ page }) => {
  await page.goto("/");

  const firstWish = page.getByRole("button", { name: /위시리스트$/ }).first();
  await expect(firstWish).toHaveAttribute("aria-pressed", "false");

  await firstWish.click();
  await expect(firstWish).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/위시리스트 1/)).toBeVisible();
});
