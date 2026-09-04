import { expect, test } from "./auth-fixtures";

// 세션 만료는 "이미 로그인된 세션이 만료됨"이라 로그인 검증이 아니다.
// 그래서 로그인 폼을 다시 채우지 않고 storageState(워커 인증 fixture)를 재사용하고,
// 시간 대신 scenario=expired 쿠키로 재현한다(쿠키가 유효해도 보호 자원이 항상 401).
test("세션이 만료되면 보호 경로에서 원래 경로를 싣고 로그인으로 유도된다", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "scenario", value: "expired", domain: "localhost", path: "/" },
  ]);

  await page.goto("/orders");

  // 보호 쿼리(meta.auth) 401 → 전역 핸들러가 location.assign으로 원래 경로를 싣고 로그인으로 이동한다.
  // 이 redirect 값이 복원 테스트가 되돌릴 바로 그 기준값이다.
  await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);
});
