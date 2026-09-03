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

test("로그인 상태는 JavaScript 없이 초기 HTML 에 들어 있다", async ({ page, account }) => {
  const anonymous = await page.request.get("/mypage", { maxRedirects: 0 });
  expect(anonymous.status()).toBe(307);
  expect(anonymous.headers()["location"]).toContain(loginUrl("/mypage"));

  await new LoginPage(page).goto();
  await new LoginPage(page).login(account.email, account.password);
  await expect(page).toHaveURL("/");

  // page.request 는 이 컨텍스트의 쿠키를 그대로 쓰고, 응답은 렌더 전 HTML 문자열이다
  const html = await (await page.request.get("/mypage")).text();
  expect(html).toContain(account.email);
  expect(html).toContain("로그아웃");
  expect(html).not.toContain('href="/login"');
});
