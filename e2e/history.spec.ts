// 뒤로/앞으로 가기로 필터가 복원된다.
// popstate + Next 라우터 + nuqs 재동기화가 함께 도는 동작이라 실제 브라우저 내비게이션으로 검증한다.
import { expect, test } from "@playwright/test";

// 검증 대상은 "필터 상태가 히스토리 내비게이션을 넘어 복원되는가"다.
// 사용자가 보는 것으로만 확인한다: select 에 표시된 옵션 텍스트(전체·패션)·주소창 URL.
test.describe("week8 검증대상 13 — 히스토리 내비게이션으로 카테고리가 복원된다", () => {
  test("카테고리를 바꾼 뒤 뒤로 가면 이전 카테고리로 복원된다", async ({
    page,
  }) => {
    const category = page.getByLabel("카테고리");
    const selected = category.locator("option:checked");
    await page.goto("/products");
    await expect(selected).toHaveText("전체");

    await category.selectOption({ label: "패션" });
    await expect(page).toHaveURL(/category=fashion/);

    await page.goBack();
    await expect(selected).toHaveText("전체");
    await expect(page).not.toHaveURL(/category=fashion/);
  });

  test("경계: 뒤로 간 뒤 앞으로 가면 방금 물렀던 카테고리가 다시 살아난다", async ({
    page,
  }) => {
    const category = page.getByLabel("카테고리");
    const selected = category.locator("option:checked");
    await page.goto("/products");

    // 앞으로 가기를 검증하려면 "바꾸고 → 뒤로 간" 상태가 먼저 있어야 한다(전제).
    await category.selectOption({ label: "패션" });
    // nuqs 는 history 쓰기를 throttle 한다. URL 반영을 안 기다리고 goBack 하면
    // pushState 보다 먼저 도달해 히스토리 스택이 이 전제와 어긋난다(실측 flake).
    await expect(page).toHaveURL(/category=fashion/);
    await page.goBack();
    await expect(selected).toHaveText("전체");

    await page.goForward();
    await expect(selected).toHaveText("패션");
    await expect(page).toHaveURL(/category=fashion/);
  });
});
