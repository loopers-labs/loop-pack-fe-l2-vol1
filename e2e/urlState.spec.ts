import { expect, test } from "@playwright/test";

// 검증 대상은 "조작이 URL 에 실리고, 그 URL 로 재진입하면 필터가 복원되는가"다.
// 목록 개수는 백엔드 소유 값이라 세지 않는다. 사용자가 보는 것으로만 확인한다:
// 필터 상태는 select 에 표시된 옵션 텍스트(전체·패션…), 반영은 주소창 URL.
test("week8 검증대상 11 — 카테고리를 바꾸면 조작이 주소창에 반영된다", async ({
  page,
}) => {
  const category = page.getByLabel("카테고리");
  await page.goto("/products");

  await category.selectOption({ label: "패션" });

  await expect(page).toHaveURL(/category=fashion/); // 주소창에 반영
  await expect(category.locator("option:checked")).toHaveText("패션"); // 보이는 선택값
});

test("week8 검증대상 11 — 경계: 필터가 담긴 URL 로 바로 진입하면 그 조건으로 화면이 복원된다", async ({
  page,
}) => {
  const category = page.getByLabel("카테고리");
  const sort = page.getByLabel("정렬");
  await page.goto("/products?category=fashion&sort=price-desc");

  await expect(category.locator("option:checked")).toHaveText("패션");
  await expect(sort.locator("option:checked")).toHaveText("높은 가격순");
});
