import { authed, expect } from "./support/fixtures";
import { checkoutPage, ordersPage } from "./support/pages";

// 3단계 시나리오 ④. 빈도 최하위권(3.7%)인데 붙였다 — 실패 비용이 유일하게
// 금전이고, 주문서 진입 419세션 중 142개(33.9%)가 완료하지 못한다.
//
// 통합에서 못 보는 것: 보호 경로 통과 + 세션 쿠키를 실은 POST + 성공 후 서버
// 상태 재조회 + 화면 이동이 한 번에 도는 것. production build 위에서만 확인된다.
//
// 워커마다 계정이 다르다. 서버의 주문 저장소가 프로세스 메모리 Map 하나라
// 같은 계정을 쓰면 서로의 주문이 상대 목록에 보인다(support/accounts.ts).

authed.describe("주문 완료", () => {
  authed("주문서에서 주문하면 주문 내역에 그 주문이 남는다", async ({ page }) => {
    // 주문 전 개수를 먼저 센다. "1개 있다"로 단언하면 워커가 남긴 주문이나
    // 재실행 때문에 결과가 달라진다 — 늘어난 **차이**를 본다.
    await page.goto("/orders");
    await expect(ordersPage(page).heading()).toBeVisible();
    const before = await page.getByRole("heading", { name: /^주문 o\d+$/ }).count();

    await page.goto("/checkout?productId=p3&quantity=2");
    await expect(checkoutPage(page).heading()).toBeVisible();
    await checkoutPage(page).submit().click();

    // 성공하면 주문 내역으로 보낸다. 주소로 먼저 확인한다.
    await expect(page).toHaveURL("/orders");
    await expect(ordersPage(page).heading()).toBeVisible();

    // 서버 상태를 다시 읽었는지 — 개수가 정확히 하나 늘어야 한다.
    await expect(page.getByRole("heading", { name: /^주문 o\d+$/ })).toHaveCount(before + 1);

    // 무엇을 주문했는지가 목록에 실렸는가. 수량까지 본다 —
    // 주문서의 URL 조건이 요청에 실렸는지는 이걸로만 드러난다.
    await expect(ordersPage(page).list()).toContainText("2개");
  });

  authed("없는 상품 id로 주문서에 들어가면 주문 버튼을 주지 않는다", async ({ page }) => {
    // 경계. 링크가 아니라 주소창에서 올 수 있는 값이다.
    await page.goto("/checkout?productId=p999");

    await expect(checkoutPage(page).failure()).toContainText("주문할 상품을 찾지 못했습니다");
    // 살 수 없는 상태에서 주문 버튼이 남으면 400을 받고 나서야 알게 된다.
    await expect(checkoutPage(page).submit()).toHaveCount(0);
  });
});
