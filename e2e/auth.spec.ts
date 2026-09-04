import { authed, currentAccount, expect, setScenario, test } from "./support/fixtures";
import { TEST_PASSWORD_VALUE } from "./support/accounts";
import { checkoutPage, header, loginPage, ordersPage } from "./support/pages";

// 3단계에서 정한 시나리오 ①②③. 인증은 빈도 7위(8.6%)인데 붙였다 —
// 로그는 몇 명이 지나갔나를 말하고 실패 비용은 말하지 않는다. 근거는
// docs/rfc/week09-e2e-scope.md C절.
//
// 통합(jsdom)에서 이걸 못 보는 이유:
//   ① proxy 리다이렉트와 로그인 후 라우터 캐시를 넘는 복원이 브라우저에만 있다
//   ② 실패해도 주소가 바뀌지 않는 것은 실제 히스토리가 있어야 확인된다
//   ③ 만료는 쿠키를 들고 서버를 다시 때려야 나온다

test.describe("인증 — 원래 경로 복원", () => {
  // storageState를 쓰지 않는다. 이 테스트가 검증하는 것이 로그인 자체라,
  // 저장된 로그인 상태를 깔면 검증 대상을 전제로 깔게 되고 로그인이 완전히
  // 깨져도 통과한다.
  test("미로그인으로 주문서에 들어가면 로그인 후 그 주소로 돌아온다", async ({ page }) => {
    const account = currentAccount();
    await page.goto("/checkout?productId=p3&quantity=2");

    // proxy가 되돌려보냈는지를 **주소로** 먼저 본다. 라벨부터 조회하면 가드가
    // 사라졌을 때 "element(s) not found"만 남아 셀렉터 문제처럼 읽힌다.
    await expect(page).toHaveURL("/login?next=%2Fcheckout%3FproductId%3Dp3%26quantity%3D2");

    await loginPage(page).fillAndSubmit(account.email, TEST_PASSWORD_VALUE);

    // 원래 가려던 주소 그대로다. 쿼리까지 살아야 무엇을 살지 주문서가 안다.
    await expect(page).toHaveURL("/checkout?productId=p3&quantity=2");
    await expect(checkoutPage(page).heading()).toBeVisible();
    // 수량이 URL에서 살아 왔는지 화면으로 확인한다.
    await expect(checkoutPage(page).total()).toContainText("수량 2개");
    // 초기 HTML의 로그인 상태 — 문서 이동 뒤라 서버가 그린 헤더다.
    await expect(header(page).account(account.name)).toBeVisible();
  });

  test("외부 주소를 복원 경로로 실어도 앱 안에 머문다", async ({ page }) => {
    const account = currentAccount();
    // 공격자가 고르는 값이다. 로그인 뒤 evil.example로 나가면 open redirect다.
    await page.goto("/login?next=https%3A%2F%2Fevil.example");
    await loginPage(page).fillAndSubmit(account.email, TEST_PASSWORD_VALUE);

    // 기본 경로로 떨어져야 한다. 주소를 값으로 대조한다 —
    // "evil이 아니다"만 단언하면 어디로 갔는지 실패 메시지가 말하지 않는다.
    await expect(page).toHaveURL("/");
    await expect(header(page).account(account.name)).toBeVisible();
  });
});

test.describe("인증 — 잘못된 자격 증명", () => {
  test("틀린 비밀번호는 화면에 이유가 남고 주소가 바뀌지 않는다", async ({ page }) => {
    const account = currentAccount();
    await page.goto("/login");
    await loginPage(page).fillAndSubmit(account.email, "wrong-password");

    await expect(loginPage(page).failure()).toContainText("이메일 또는 비밀번호를 확인해주세요");
    // 실패했는데 이동하면 입력한 값이 사라져 처음부터 다시 친다.
    await expect(page).toHaveURL("/login");
    // 로그인되지 않았다는 것을 헤더로 본다. 로그인 링크가 그 신호다.
    await expect(header(page).loginLink()).toBeVisible();
  });

  test("자격 증명이 맞아도 서버가 거절하면(invalid) 같은 자리에 남는다", async ({ page }) => {
    const account = currentAccount();
    await page.goto("/login");
    await setScenario(page, "invalid");
    await loginPage(page).fillAndSubmit(account.email, TEST_PASSWORD_VALUE);

    await expect(loginPage(page).failure()).toContainText("이메일 또는 비밀번호를 확인해주세요");
    await expect(page).toHaveURL("/login");
  });
});

authed.describe("인증 — 세션 만료", () => {
  // 여기는 storageState를 쓴다. 만료는 **로그인 이후**의 이야기라,
  // 로그인 폼을 다시 채우면 이 테스트가 두 가지를 보게 된다.
  authed("만료된 세션으로 주문 내역에 들어가면 다시 로그인하라고 말한다", async ({ page }) => {
    await page.goto("/orders");
    // 쿠키가 있으므로 proxy는 통과한다 — 만료 판정은 페이지와 API가 한다.
    await expect(ordersPage(page).heading()).toBeVisible();

    // 시간을 흘려 만료시키지 않는다. TTL이 1시간이다.
    await setScenario(page, "expired");
    await page.reload();

    // 세션 만료 처리 자리가 한 곳(QueryCache.onError)이라, 화면은 그 결과만 그린다.
    await expect(ordersPage(page).failure()).toContainText("세션이 만료되었습니다");
    await expect(page.getByRole("main").getByRole("link", { name: "로그인" })).toBeVisible();
  });
});
