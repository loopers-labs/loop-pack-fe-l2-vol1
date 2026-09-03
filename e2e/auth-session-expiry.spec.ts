import { test, expect } from './support/fixtures';

// 세션 만료 시뮬레이션. 실제로 TTL을 줄여서 재현하면 테스트가 시계에
// 의존해 flaky해지므로, 서버가 제공하는 scenario=expired 쿠키로 재현한다.
//
// 로그인 상태(storageState, 기본값)에서 시작한다 — "실제로 유효했던 세션이
// 이후 만료됨"을 재현하려는 것이라 session 쿠키 자체가 없는 미로그인과는
// 다른 상황이다. proxy.ts는 session 쿠키의 존재만 확인하므로, 쿠키가
// 아예 없으면 proxy가 먼저 /login으로 보내버려 "만료" 시나리오를 아예
// 재현할 수 없다.
test('세션이 만료되면 다시 로그인하라고 안내한다', async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error('baseURL이 설정되지 않았다 (playwright.config.ts 확인)');
  }

  await context.addCookies([
    { name: 'scenario', value: 'expired', url: baseURL },
  ]);

  await page.goto('/orders');

  await expect(page).toHaveURL(/\/login\?.*reason=expired/);
  await expect(
    page.getByText('세션이 만료되었습니다. 다시 로그인해주세요.'),
  ).toBeVisible();
});
