import { expect, test } from "./fixtures/auth";
import { Header } from "./pages/header";
import { LoginPage } from "./pages/login-page";
import { loginUrl } from "./pages/urls";

// 로그인된 워커 storageState 위에서 만료를 재현한다. 만료는 시간으로 만들지 않고 scenario 노브를 쓴다 —
// 앱 안에서 부르는 /api/auth/me 에는 query 를 붙일 수 없으니 쿠키로 넣는다
test("세션이 만료되면 만료 안내와 함께 로그인으로 보내고, 돌아갈 경로를 기억한다", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "scenario", value: "expired", url: baseURL }]);

  await page.goto("/mypage");

  await expect(page).toHaveURL(loginUrl("/mypage", "expired"));
  await expect(new LoginPage(page).expiredNotice).toBeVisible();
  // 죽은 세션 쿠키는 정리되어 헤더도 로그아웃 상태다 — 다음에 무엇을 해야 할지 한 화면에서 보인다
  await expect(new Header(page).loginLink).toBeVisible();
});
