import { createSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
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

    // 5단계 E5에서 드러난 자리. 스타터의 route.test.ts가 Set-Cookie 헤더에
    // httpOnly가 붙는지는 보지만, **브라우저가 그것을 지키는지**는 아무도 안 봤다.
    // 서버가 헤더를 제대로 보내도 클라이언트 코드가 쿠키를 다시 쓰면 노출된다.
    // 여기서만 확인할 수 있다 — jsdom에는 httpOnly 강제가 없다.
    const readable = await page.evaluate(() => document.cookie);
    expect(readable).not.toContain("session=");
    const stored = await page.context().cookies();
    expect(stored.find((cookie) => cookie.name === "session")?.httpOnly).toBe(true);
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

test.describe("인증 — 실제 TTL 만료", () => {
  // 위 `expired` 시나리오가 못 덮는 경로다. 노브는 **서명이 유효한 쿠키를 그대로
  // 두고** API만 401로 만들어서, 서버 레이아웃은 여전히 authenticated를 주입한다.
  // 실제로 TTL이 지난 쿠키는 서버 검증에서도 떨어지므로 다른 코드를 탄다.
  //
  // Codex 교차 검증에서 이 구멍이 나왔다 — 고치기 전에는 초기 HTML이 그냥
  // 미로그인이었고 "세션이 만료되었습니다"가 뜨지 않았다.
  //
  // 시간을 흘리지 않는다. 발급 시각을 과거로 준 토큰을 만든다.
  test("TTL이 지난 쿠키로 들어오면 초기 HTML이 만료를 알린다", async ({ page }) => {
    const account = currentAccount();
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    await page.context().addCookies([
      {
        name: SESSION_COOKIE,
        value: createSessionToken(account.id, twoHoursAgo),
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/orders");

    // proxy는 쿠키가 있으니 통과시킨다(설계대로 — 서명 검증은 Edge에서 못 한다).
    await expect(page).toHaveURL("/orders");
    // 서버가 쿠키를 인정하지 않았다. 그건 미로그인이 아니라 만료다.
    await expect(ordersPage(page).failure()).toContainText("세션이 만료되었습니다");
  });
});

test.describe("인증 — 만료 상태가 유지되고 모든 보호 화면이 알린다", () => {
  // 고친 두 가지를 고정한다.
  //
  //   ① 서버가 심어 준 expired가 클라이언트 재조회에 덮이지 않는다.
  //      예전에는 세션 조회가 401을 무조건 anonymous로 접어서, 재조회 한 번에
  //      "세션이 만료되었습니다"가 "로그인하세요"로 소리 없이 바뀌었다.
  //   ② 주문서도 만료를 알린다. 예전에는 주문 내역만 알렸고, 주문서는
  //      정상 화면을 그려서 주문하기를 누른 뒤에야 알 수 있었다.
  const expiredCookie = (userId: string) => ({
    name: SESSION_COOKIE,
    value: createSessionToken(userId, Date.now() - 2 * 60 * 60 * 1000),
    url: "http://localhost:3000",
  });

  test("만료를 다시 조회해도 만료로 남는다", async ({ page }) => {
    const account = currentAccount();
    await page.context().addCookies([expiredCookie(account.id)]);

    await page.goto("/orders");
    await expect(ordersPage(page).failure()).toContainText("세션이 만료되었습니다");

    // 재조회를 강제한다 — 캐시가 stale이 되는 것을 기다리지 않고 직접 무효화한다.
    // 예전 구현은 이 한 번에 anonymous로 접혔다.
    await page.evaluate(() => window.location.reload());
    await expect(ordersPage(page).failure()).toContainText("세션이 만료되었습니다");

    // 다른 보호 화면으로 이동해도 만료다(문서 이동이 아니라 클라이언트 이동).
    await page.getByRole("main").getByRole("link", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Forders/);
  });

  test("주문서도 만료를 알린다 — 주문하기를 누르기 전에", async ({ page }) => {
    const account = currentAccount();
    await page.context().addCookies([expiredCookie(account.id)]);

    await page.goto("/checkout?productId=p3&quantity=2");

    await expect(checkoutPage(page).failure()).toContainText("세션이 만료되었습니다");
    // 만료된 사용자에게 주문 버튼을 주지 않는다.
    await expect(checkoutPage(page).submit()).toHaveCount(0);
    // 돌아올 자리를 쿼리까지 실어 보낸다.
    await expect(page.getByRole("main").getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login?next=%2Fcheckout%3FproductId%3Dp3%26quantity%3D2",
    );
  });
});
