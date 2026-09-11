import { BASE_URL } from './base-url';
import { expect, test } from './fixtures';
import { expectLoggedOut } from './pom/header';

// E2 (RFC C절). storageState로 로그인된 상태에서 시작한다 — 검증 대상은 로그인이 아니라 만료 처리다.
// 만료는 시간으로 재현하지 않는다: `scenario=expired` 쿠키는 앱 내부 요청 전부에 실려 서버가 401을 준다.
test('E2 세션이 만료되면 다시 로그인하라고 안내하고 원래 경로를 기억한다', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: 'scenario', value: 'expired', url: BASE_URL },
  ]);

  await page.goto('/orders');
  // 쿠키는 있으므로 proxy는 통과시킨다 — URL은 /orders에 머물러야 한다 (RFC D2·D5).
  await expect(page).toHaveURL('/orders');

  // error.tsx가 페이지 본문을 대체하므로 main 랜드마크가 없다. 그리고 Next 라우트 안내자도
  // role=alert라 그냥 getByRole('alert')이면 두 개가 잡힌다 — 문구로 좁힌다(테스트 id 없이).
  const alert = page
    .getByRole('alert')
    .filter({ hasText: '세션이 만료됐어요' });
  await expect(alert).toContainText('세션이 만료됐어요');
  await expect(
    alert.getByRole('link', { name: '다시 로그인' }),
  ).toHaveAttribute('href', '/login?next=%2Forders');
  // 경계가 세션 캐시를 비웠으므로 헤더도 로그아웃 상태다.
  await expectLoggedOut(page);
});
