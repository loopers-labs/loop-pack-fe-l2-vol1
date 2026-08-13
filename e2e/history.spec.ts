// 뒤로/앞으로 가기로 필터가 복원된다.
// popstate + Next 라우터 + nuqs 재동기화가 함께 도는 동작이라 실제 브라우저 내비게이션으로 검증한다.
import { expect, test } from "@playwright/test";

// 검증 대상은 "필터 상태가 히스토리 내비게이션을 넘어 복원되는가"다.
// 사용자가 보는 것으로만 확인한다: select 에 표시된 옵션 텍스트(전체·패션)·주소창 URL.
test("week8 검증대상 13 — 뒤로 가면 이전 카테고리로, 앞으로 가면 다시 바꾼 카테고리로 복원된다", async ({
  page,
}) => {
  const category = page.getByLabel("카테고리");
  const selected = category.locator("option:checked");
  await page.goto("/products");
  await expect(selected).toHaveText("전체");

  await category.selectOption({ label: "패션" });
  await expect(page).toHaveURL(/category=fashion/);

  await page.goBack();
  await expect(selected).toHaveText("전체"); // 뒤로(정상): 이전 카테고리 복원
  await expect(page).not.toHaveURL(/category=fashion/);

  // 경계: 앞으로 가면 방금 뒤로 물렀던 카테고리로 다시 복원된다.
  await page.goForward();
  await expect(selected).toHaveText("패션");
  await expect(page).toHaveURL(/category=fashion/);
});
