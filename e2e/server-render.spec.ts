import { expect, test } from '@playwright/test';
import { createSessionCookie } from './pages/sessionCookie';

/**
 * 서버가 로그인 상태까지 그려서 내려주는지 본다.
 *
 * 나머지 E2E는 JS가 켜진 브라우저에서 돈다. 그러면 서버가 세션을 심지 않아도 클라이언트가
 * `/api/auth/me`를 불러 화면을 채우기 때문에, 최종 화면만 보고는 서버가 그렸는지 알 수 없다.
 * `src/app/orders/page.tsx`의 `setQueryData(SESSION_QUERY_KEY, ...)`를 지워도 그 테스트들은
 * 전부 통과한다.
 *
 * JS를 끄면 서버가 내려준 HTML만 남으므로 그 몫만 확인된다. 여기서 지키는 것은 "JS 없는
 * 사용자"보다도 첫 화면의 안정성이다 — 서버가 로그인 상태를 안 그리면 로그인 링크가 떴다가
 * 사용자 이름으로 바뀌면서 헤더가 흔들린다.
 */
test.use({ javaScriptEnabled: false });

test('JS 없이도 서버가 로그인 상태와 보호 화면 본문을 그려서 내려준다', async ({
  page,
  context,
  baseURL,
}) => {
  if (baseURL === undefined) {
    throw new Error('Playwright baseURL이 필요합니다.');
  }

  await context.addCookies([createSessionCookie('u1', baseURL)]);
  await page.goto('/orders');

  const navigation = page.getByRole('navigation', { name: '주요 메뉴' });

  await test.step('Header가 로그인 상태로 그려져 있다', async () => {
    await expect(navigation.getByText('루퍼1님')).toBeVisible();
    await expect(navigation.getByRole('link', { name: '주문 내역' })).toBeVisible();
    await expect(navigation.getByRole('link', { name: '로그인' })).toHaveCount(0);
  });

  await test.step('보호 화면 본문도 그려져 있다', async () => {
    await expect(page.getByRole('heading', { name: '주문 내역' })).toBeVisible();
  });
});
