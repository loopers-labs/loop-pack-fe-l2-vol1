// 새로고침해도 필터 상태가 유지된다.
// reload 후 URL 파싱과 화면 복원은 실제 문서 재로드라야 검증된다.
import { expect, test } from "@playwright/test";

// 검증 대상은 "필터 상태가 재로드를 넘어 유지되는가"다. 목록 개수는 백엔드 소유 값이라 세지 않고,
// 사용자가 보는 것으로만 확인한다: select 에 표시된 옵션 텍스트(전체·패션·높은 가격순)·주소창 URL.
test("week8 검증대상 14 — 필터가 걸린 상태에서 새로고침해도 카테고리·정렬이 그대로다", async ({
  page,
}) => {
  const category = page.getByLabel("카테고리").locator("option:checked");
  const sort = page.getByLabel("정렬").locator("option:checked");
  await page.goto("/products?category=fashion&sort=price-desc");
  await expect(category).toHaveText("패션");

  await page.reload();

  await expect(category).toHaveText("패션");
  await expect(sort).toHaveText("높은 가격순");
});

test("week8 검증대상 14 — 경계: URL 로 직접 들어온 게 아니라 화면에서 바꾼 필터도 새로고침 후 유지된다", async ({
  page,
}) => {
  const category = page.getByLabel("카테고리");
  await page.goto("/products");

  // 직접 URL 진입(정상 케이스)과 달리, 화면 조작으로 URL 상태를 만든다.
  await category.selectOption({ label: "패션" });
  await expect(page).toHaveURL(/category=fashion/);

  await page.reload();

  await expect(category.locator("option:checked")).toHaveText("패션");
});
