import { expect, test } from "./fixtures/auth";
import { Header } from "./pages/header";
import { LoginPage } from "./pages/login-page";
import { loginUrl } from "./pages/urls";

// 로그인 자체를 검증한다. 워커 storageState 를 쓰면 검증 대상을 픽스처가 대신 해 버리므로 비운 상태로 시작한다
test.use({ storageState: { cookies: [], origins: [] } });

test("미로그인으로 보호 경로에 들어가면 로그인 뒤 원래 경로로 돌아온다", async ({
  page,
  account,
}) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(loginUrl("/orders"));

  await new LoginPage(page).login(account.email, account.password);

  await expect(page).toHaveURL("/orders");
  await expect(new Header(page).greeting(account.name)).toBeVisible();
});

test("복원 경로가 외부 주소면 홈으로 떨어진다", async ({ page, account }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto("?next=https%3A%2F%2Fevil.com");

  await loginPage.login(account.email, account.password);

  await expect(page).toHaveURL("/");
  await expect(new Header(page).greeting(account.name)).toBeVisible();
});

test("자격 증명이 틀리면 안내 문구가 보이고 로그인 화면에 머문다", async ({ page, account }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(account.email, "wrong-password");

  await expect(loginPage.errorAlert).toHaveText("이메일 또는 비밀번호를 확인해주세요.");
  await expect(page).toHaveURL("/login");
  await expect(new Header(page).loginLink).toBeVisible();
});

test("로그인 상태는 JavaScript 없이 초기 HTML 에 들어 있다", async ({
  page,
  browser,
  baseURL,
  account,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(account.email, account.password);
  await expect(page).toHaveURL("/");

  // 같은 쿠키로 JavaScript 를 끈 컨텍스트를 연다 — 보이는 것은 서버가 보낸 HTML 그대로다
  const noScript = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    storageState: await page.context().storageState(),
  });
  const staticPage = await noScript.newPage();
  await staticPage.goto("/mypage");
  const header = new Header(staticPage);
  await expect(header.greeting(account.name)).toBeVisible();
  await expect(header.logoutButton).toBeVisible();
  await expect(header.loginLink).toHaveCount(0);
  await expect(staticPage.getByText(account.email)).toBeVisible();
  await noScript.close();

  // 반대로 익명 HTML 에는 로그인 링크가 있다 — 헤더가 서버에서 아예 렌더되지 않아도 위 단언이 통과하는 일을 막는다
  const anonymous = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto("/");
  await expect(new Header(anonymousPage).loginLink).toBeVisible();
  const guarded = await anonymousPage.request.get("/mypage", { maxRedirects: 0 });
  expect(guarded.status()).toBe(307);
  expect(guarded.headers()["location"]).toContain(loginUrl("/mypage"));
  await anonymous.close();
});
